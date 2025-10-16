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

if (!function_exists('anomfin_settings_table_name')) {
    function anomfin_settings_table_name(): string
    {
        return 'sivuston_asetukset';
    }
}

if (!function_exists('anomfin_settings_merge')) {
    function anomfin_settings_merge(array $defaults, array $data): array
    {
        $merged = $defaults;

        if (isset($data['cssVars']) && is_array($data['cssVars'])) {
            $merged['cssVars'] = array_merge($defaults['cssVars'], $data['cssVars']);
        } else {
            $merged['cssVars'] = $defaults['cssVars'];
        }

        if (isset($data['behaviors']) && is_array($data['behaviors'])) {
            $merged['behaviors'] = array_merge($defaults['behaviors'], $data['behaviors']);
        } else {
            $merged['behaviors'] = $defaults['behaviors'];
        }

        if (isset($data['branding']) && is_array($data['branding'])) {
            $merged['branding'] = array_merge($defaults['branding'] ?? [], $data['branding']);
        } else {
            $merged['branding'] = $defaults['branding'] ?? [];
        }

        if (isset($data['content']) && is_array($data['content'])) {
            $merged['content'] = array_merge($defaults['content'] ?? [], $data['content']);
        } else {
            $merged['content'] = $defaults['content'] ?? [];
        }

        if (isset($data['shortener']) && is_array($data['shortener'])) {
            $merged['shortener'] = array_merge($defaults['shortener'] ?? [], $data['shortener']);
        } else {
            $merged['shortener'] = $defaults['shortener'] ?? [];
        }

        if (isset($data['integrations']['chat']) && is_array($data['integrations']['chat'])) {
            $merged['integrations']['chat'] = array_merge($defaults['integrations']['chat'] ?? [], $data['integrations']['chat']);
        } else {
            $merged['integrations']['chat'] = $defaults['integrations']['chat'] ?? [];
        }

        if (array_key_exists('preset', $data)) {
            $merged['preset'] = $data['preset'];
        }

        if (isset($data['meta']) && is_array($data['meta'])) {
            $merged['meta'] = array_merge($defaults['meta'], $data['meta']);
        }

        return $merged;
    }
}

if (!function_exists('anomfin_ensure_settings_table')) {
    function anomfin_ensure_settings_table(\mysqli $mysqli): bool
    {
        $table = anomfin_settings_table_name();
        $sql = sprintf(
            'CREATE TABLE IF NOT EXISTS `%s` (
                id TINYINT UNSIGNED NOT NULL,
                settings_json LONGTEXT NOT NULL,
                updated_at DATETIME NOT NULL,
                updated_by VARCHAR(191) NOT NULL DEFAULT \'Tuntematon\',
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            $mysqli->real_escape_string($table)
        );

        return $mysqli->query($sql) === true;
    }
}

if (!function_exists('anomfin_settings_load')) {
    function anomfin_settings_load(string $file, array $defaults): array
    {
        $mysqli = function_exists('anomfin_get_mysqli') ? anomfin_get_mysqli() : null;

        if ($mysqli instanceof \mysqli && anomfin_ensure_settings_table($mysqli)) {
            $table = anomfin_settings_table_name();
            $sql = sprintf('SELECT settings_json FROM `%s` WHERE id = 1 LIMIT 1', $table);
            $stmt = $mysqli->prepare($sql);
            $data = null;
            if ($stmt instanceof \mysqli_stmt && $stmt->execute()) {
                $result = $stmt->get_result();
                if ($result instanceof \mysqli_result) {
                    $row = $result->fetch_assoc();
                    if (is_array($row) && isset($row['settings_json'])) {
                        $decoded = json_decode((string) $row['settings_json'], true);
                        if (is_array($decoded)) {
                            $data = $decoded;
                        }
                    }
                }
                $stmt->close();
            }

            if (is_array($data)) {
                return anomfin_settings_merge($defaults, $data);
            }

            $json = json_encode($defaults, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            if ($json !== false) {
                $insert = sprintf('INSERT INTO `%s` (id, settings_json, updated_at, updated_by) VALUES (1, ?, UTC_TIMESTAMP(), \'Järjestelmä\') ON DUPLICATE KEY UPDATE settings_json = VALUES(settings_json)', $table);
                $insertStmt = $mysqli->prepare($insert);
                if ($insertStmt instanceof \mysqli_stmt) {
                    $insertStmt->bind_param('s', $json);
                    $insertStmt->execute();
                    $insertStmt->close();
                }
            }

            return $defaults;
        }

        if (!file_exists($file)) {
            anomfin_write_json_atomic($file, $defaults);
            return $defaults;
        }

        $data = json_decode((string) file_get_contents($file), true);
        if (!is_array($data)) {
            return $defaults;
        }

        return anomfin_settings_merge($defaults, $data);
    }
}

if (!function_exists('anomfin_settings_save')) {
    function anomfin_settings_save(string $file, array $settings): bool
    {
        $mysqli = function_exists('anomfin_get_mysqli') ? anomfin_get_mysqli() : null;

        if ($mysqli instanceof \mysqli && anomfin_ensure_settings_table($mysqli)) {
            $json = json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            if ($json === false) {
                return false;
            }

            $updatedAtIso = $settings['meta']['updated_at'] ?? gmdate('c');
            try {
                $dt = new \DateTimeImmutable($updatedAtIso);
                $dt = $dt->setTimezone(new \DateTimeZone('UTC'));
                $updatedAtSql = $dt->format('Y-m-d H:i:s');
            } catch (\Exception $exception) {
                $updatedAtSql = gmdate('Y-m-d H:i:s');
            }

            $updatedBy = (string) ($settings['meta']['updated_by'] ?? 'Tuntematon');

            $table = anomfin_settings_table_name();
            $sql = sprintf(
                'INSERT INTO `%s` (id, settings_json, updated_at, updated_by) VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE settings_json = VALUES(settings_json), updated_at = VALUES(updated_at), updated_by = VALUES(updated_by)',
                $table
            );

            $stmt = $mysqli->prepare($sql);
            if ($stmt instanceof \mysqli_stmt) {
                $stmt->bind_param('sss', $json, $updatedAtSql, $updatedBy);
                $result = $stmt->execute();
                $stmt->close();

                if ($result) {
                    return true;
                }
            }
        }

        return anomfin_write_json_atomic($file, $settings);
    }
}
