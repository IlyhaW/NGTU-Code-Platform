package com.example.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
/**
 * Сервис запуска и проверки Python-решений в изолированном процессе.
 */
public class PythonJudgeService {
    private static final ObjectMapper JSON = new ObjectMapper().findAndRegisterModules();

    private final String pythonExecutable;

    /**
     * Инициализирует исполняемый файл Python из конфигурации.
     */
    public PythonJudgeService(@Value("${judge.python.executable:python}") String pythonExecutable) {
        this.pythonExecutable = pythonExecutable == null || pythonExecutable.isBlank()
                ? "python"
                : pythonExecutable.trim();
    }

    /** Выполняет код студента и возвращает результат запуска с лимитами. */
    public PythonRunResult run(
            String studentCode,
            String inputData,
            long timeLimitMs,
            long memoryLimitKb) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("judge-" + UUID.randomUUID());
            Path codeFile = tempDir.resolve("solution.py");
            Path inputFile = tempDir.resolve("input.txt");
            Path runnerFile = tempDir.resolve("runner.py");

            Files.writeString(codeFile, studentCode == null ? "" : studentCode, StandardCharsets.UTF_8);
            Files.writeString(inputFile, inputData == null ? "" : inputData, StandardCharsets.UTF_8);
            Files.writeString(runnerFile, buildRunnerScript(), StandardCharsets.UTF_8);

            RawRunnerResult raw = runRunner(
                    pythonExecutable, runnerFile, codeFile, inputFile, timeLimitMs, memoryLimitKb, tempDir);
            if (raw.timedOut()) {
                return new PythonRunResult(false, "", "", timeLimitMs, memoryLimitKb, "TLE");
            }
            String out = raw.output();
            if (out == null || out.isBlank()) {
                return new PythonRunResult(false, "", "", 0, 0, "RE: empty runner output");
            }
            if (looksLikePythonAliasMessage(out) && !isPyLauncher(pythonExecutable)) {
                RawRunnerResult fallback = runRunner(
                        "py -3", runnerFile, codeFile, inputFile, timeLimitMs, memoryLimitKb, tempDir);
                if (fallback.timedOut()) {
                    return new PythonRunResult(false, "", "", timeLimitMs, memoryLimitKb, "TLE");
                }
                if (fallback.output() != null && !fallback.output().isBlank()) {
                    out = fallback.output();
                }
            }
            JsonNode node;
            try {
                node = JSON.readTree(out);
            } catch (Exception parseEx) {
                String trimmed = out.trim();
                if (looksLikePythonNotFound(trimmed)) {
                    return new PythonRunResult(
                            false,
                            "",
                            "",
                            0,
                            0,
                            "RE: Python interpreter not found. Configure judge.python.executable.");
                }
                String snippet = trimmed.length() > 220 ? trimmed.substring(0, 220) + "..." : trimmed;
                return new PythonRunResult(false, "", "", 0, 0, "RE: invalid runner output: " + snippet);
            }
            boolean ok = node.path("ok").asBoolean(false);
            long elapsedMs = node.path("elapsedMs").asLong(0L);
            long memoryKbUsed = node.path("memoryKb").asLong(0L);
            String stdout = node.path("stdout").asText("");
            String stderr = node.path("stderr").asText("");
            String error = node.path("error").asText("");
            if (!ok) {
                String verdict = classifyError(error);
                return new PythonRunResult(false, stdout, stderr, elapsedMs, memoryKbUsed, verdict + ": " + error);
            }
            if (elapsedMs > timeLimitMs) {
                return new PythonRunResult(false, stdout, stderr, elapsedMs, memoryKbUsed, "TLE");
            }
            if (memoryKbUsed > memoryLimitKb && memoryLimitKb > 0) {
                return new PythonRunResult(false, stdout, stderr, elapsedMs, memoryKbUsed, "MLE");
            }
            return new PythonRunResult(true, stdout, stderr, elapsedMs, memoryKbUsed, "");
        } catch (Exception e) {
            return new PythonRunResult(false, "", "", 0, 0, "RE: " + e.getMessage());
        } finally {
            if (tempDir != null) {
                try {
                    Files.walk(tempDir)
                            .sorted((a, b) -> b.getNameCount() - a.getNameCount())
                            .forEach(path -> {
                                try {
                                    Files.deleteIfExists(path);
                                } catch (IOException ignored) {
                                }
                            });
                } catch (IOException ignored) {
                }
            }
        }
    }

    /** Запускает runner-процесс с fallback на py launcher при необходимости. */
    private Process startRunnerProcess(
            Path runnerFile,
            Path codeFile,
            Path inputFile,
            long memoryLimitKb,
            Path tempDir) throws IOException {
        List<String> primary = runnerCommand(pythonExecutable, runnerFile, codeFile, inputFile, memoryLimitKb);
        try {
            return new ProcessBuilder(primary)
                    .directory(tempDir.toFile())
                    .redirectErrorStream(true)
                    .start();
        } catch (IOException e) {
            if (!isLikelyPythonNotFound(e.getMessage())) {
                throw e;
            }
            // Windows fallback: py launcher is often available when "python" alias is disabled.
            List<String> fallback = runnerCommand("py -3", runnerFile, codeFile, inputFile, memoryLimitKb);
            return new ProcessBuilder(fallback)
                    .directory(tempDir.toFile())
                    .redirectErrorStream(true)
                    .start();
        }
    }

    /** Выполняет runner с таймаутом и возвращает сырое содержимое stdout. */
    private RawRunnerResult runRunner(
            String executable,
            Path runnerFile,
            Path codeFile,
            Path inputFile,
            long timeLimitMs,
            long memoryLimitKb,
            Path tempDir) throws Exception {
        Process p = startRunnerProcessWithExecutable(executable, runnerFile, codeFile, inputFile, memoryLimitKb, tempDir);
        boolean finished = p.waitFor(
                Duration.ofMillis(Math.max(200, timeLimitMs + 150)).toMillis(),
                java.util.concurrent.TimeUnit.MILLISECONDS);
        if (!finished) {
            p.destroyForcibly();
            return new RawRunnerResult("", true);
        }
        String out = new String(p.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        return new RawRunnerResult(out, false);
    }

    /** Запускает runner с указанным исполняемым файлом Python. */
    private Process startRunnerProcessWithExecutable(
            String executableConfig,
            Path runnerFile,
            Path codeFile,
            Path inputFile,
            long memoryLimitKb,
            Path tempDir) throws IOException {
        List<String> primary = runnerCommand(executableConfig, runnerFile, codeFile, inputFile, memoryLimitKb);
        return new ProcessBuilder(primary)
                .directory(tempDir.toFile())
                .redirectErrorStream(true)
                .start();
    }

    /** Формирует команду запуска runner-скрипта. */
    private static List<String> runnerCommand(
            String executableConfig,
            Path runnerFile,
            Path codeFile,
            Path inputFile,
            long memoryLimitKb) {
        List<String> cmd = splitCommand(executableConfig);
        cmd.add(runnerFile.toString());
        cmd.add(codeFile.toString());
        cmd.add(inputFile.toString());
        cmd.add(String.valueOf(Math.max(1, memoryLimitKb)));
        return cmd;
    }

    /** Разбивает команду запуска на аргументы. */
    private static List<String> splitCommand(String raw) {
        String safe = raw == null || raw.isBlank() ? "python" : raw.trim();
        String[] parts = safe.split("\\s+");
        List<String> out = new ArrayList<>();
        for (String p : parts) {
            if (!p.isBlank()) out.add(p);
        }
        if (out.isEmpty()) out.add("python");
        return out;
    }

    /** Определяет ошибку запуска процесса при отсутствии интерпретатора. */
    private static boolean isLikelyPythonNotFound(String msg) {
        if (msg == null) return false;
        String m = msg.toLowerCase();
        return m.contains("cannot run program")
                || m.contains("createprocess error=2")
                || m.contains("not recognized");
    }

    /** Определяет сообщение об отсутствии Python в текстовом выводе. */
    private static boolean looksLikePythonNotFound(String output) {
        if (output == null) return false;
        String m = output.toLowerCase();
        return m.startsWith("python was not found")
                || m.contains("install from the microsoft store")
                || m.contains("is not recognized as an internal or external command");
    }

    /** Определяет сообщение алиаса Python из Microsoft Store. */
    private static boolean looksLikePythonAliasMessage(String output) {
        if (output == null) return false;
        String m = output.trim().toLowerCase(Locale.ROOT);
        return m.startsWith("python")
                || m.contains("microsoft store")
                || m.contains("python was not found");
    }

    /** Проверяет, что конфигурация уже использует py launcher. */
    private static boolean isPyLauncher(String executable) {
        if (executable == null) return false;
        String e = executable.trim().toLowerCase(Locale.ROOT);
        return e.startsWith("py");
    }

    /**
     * Технический результат выполнения runner-скрипта.
     */
    private record RawRunnerResult(String output, boolean timedOut) {}

    /** Возвращает встроенный runner-скрипт для безопасного исполнения решения. */
    private static String buildRunnerScript() {
        return ""
                + "import contextlib, io, json, sys, time, traceback, tracemalloc\n"
                + "try:\n"
                + "  import resource\n"
                + "except Exception:\n"
                + "  resource = None\n"
                + "code_path = sys.argv[1]\n"
                + "input_path = sys.argv[2]\n"
                + "memory_kb = int(sys.argv[3])\n"
                + "if resource is not None and memory_kb > 0:\n"
                + "  lim = memory_kb * 1024\n"
                + "  try:\n"
                + "    resource.setrlimit(resource.RLIMIT_AS, (lim, lim))\n"
                + "  except Exception:\n"
                + "    pass\n"
                + "code = open(code_path, 'r', encoding='utf-8').read()\n"
                + "stdin_data = open(input_path, 'r', encoding='utf-8').read()\n"
                + "ns = {'__name__': '__main__'}\n"
                + "tracemalloc.start()\n"
                + "start = time.perf_counter()\n"
                + "stdout_buf = io.StringIO()\n"
                + "stderr_buf = io.StringIO()\n"
                + "try:\n"
                + "  with contextlib.redirect_stdout(stdout_buf), contextlib.redirect_stderr(stderr_buf):\n"
                + "    sys.stdin = io.StringIO(stdin_data)\n"
                + "    exec(compile(code, code_path, 'exec'), ns, ns)\n"
                + "  elapsed = int((time.perf_counter() - start) * 1000)\n"
                + "  peak = int(tracemalloc.get_traced_memory()[1] / 1024)\n"
                + "  print(json.dumps({'ok': True, 'stdout': stdout_buf.getvalue(), 'stderr': stderr_buf.getvalue(), "
                + "'elapsedMs': elapsed, 'memoryKb': peak}, ensure_ascii=False))\n"
                + "except BaseException:\n"
                + "  elapsed = int((time.perf_counter() - start) * 1000)\n"
                + "  peak = int(tracemalloc.get_traced_memory()[1] / 1024)\n"
                + "  print(json.dumps({'ok': False, 'stdout': stdout_buf.getvalue(), 'stderr': stderr_buf.getvalue(), "
                + "'elapsedMs': elapsed, 'memoryKb': peak, 'error': traceback.format_exc(limit=6)}, ensure_ascii=False))\n";
    }

    /**
     * Публичный результат проверки решения Python.
     */
    public record PythonRunResult(
            boolean ok,
            String stdout,
            String stderr,
            long elapsedMs,
            long memoryKb,
            String error) {}

    /** Классифицирует ошибку выполнения в вердикт CE/MLE/RE. */
    private static String classifyError(String rawError) {
        String e = rawError == null ? "" : rawError;
        if (e.contains("SyntaxError") || e.contains("IndentationError") || e.contains("TabError")) {
            return "CE";
        }
        if (e.contains("MemoryError")) {
            return "MLE";
        }
        return "RE";
    }
}
