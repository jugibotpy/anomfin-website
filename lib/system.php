<?php
declare(strict_types=1);

if (!function_exists('anomfin_ensure_directory')) {
    function anomfin_ensure_directory(string $directory, int $mode = 0775): bool
    {
        if (is_dir($directory)) {
            return true;
        }

        if (@mkdir($directory, $mode, true)) {
            return true;
        }

        return is_dir($directory);
    }
}

if (!function_exists('anomfin_write_json_atomic')) {
    function anomfin_write_json_atomic(string $file, array $data, int $mode = 0664): bool
    {
        $directory = dirname($file);
        if (!anomfin_ensure_directory($directory)) {
            return false;
        }

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            return false;
        }

        $tempFile = tempnam($directory, 'anomfin');
        if ($tempFile === false) {
            return false;
        }

        $bytes = file_put_contents($tempFile, $json);
        if ($bytes === false) {
            @unlink($tempFile);
            return false;
        }

        @chmod($tempFile, $mode);

        if (!@rename($tempFile, $file)) {
            @unlink($tempFile);
            return false;
        }

        clearstatcache(true, $file);

        return true;
    }
}

if (!function_exists('anomfin_read_json_file')) {
    function anomfin_read_json_file(string $file, array $default = []): array
    {
        if (!is_file($file)) {
            return $default;
        }

        $data = json_decode((string) file_get_contents($file), true);

        return is_array($data) ? $data : $default;
    }
}

if (!function_exists('anomfin_format_permissions')) {
    function anomfin_format_permissions(string $path): string
    {
        if (!file_exists($path)) {
            return '----';
        }

        $perms = @fileperms($path);
        if ($perms === false) {
            return '----';
        }

        return substr(sprintf('%o', $perms), -4);
    }
}
