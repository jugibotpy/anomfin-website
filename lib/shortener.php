<?php
declare(strict_types=1);

if (!function_exists('anomfin_load_settings')) {
    function anomfin_load_settings(string $file, array $defaults): array
    {
        if (!is_file($file)) {
            return $defaults;
        }

        $data = json_decode((string) file_get_contents($file), true);
        if (!is_array($data)) {
            return $defaults;
        }

        return array_replace_recursive($defaults, $data);
    }
}

if (!function_exists('anomfin_generate_unique_code')) {
    /**
     * @param callable(string):bool $exists
     */
    function anomfin_generate_unique_code(callable $exists, int $maxLength): string
    {
        $length = max(1, min($maxLength, 8));
        $alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
        $attempts = 0;

        do {
            $attempts++;
            $candidate = '';
            for ($i = 0; $i < $length; $i++) {
                $candidate .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
            if (!$exists($candidate)) {
                return $candidate;
            }
        } while ($attempts < 20);

        throw new RuntimeException('Lyhennettä ei pystytty generoimaan ilman törmäyksiä');
    }
}

if (!function_exists('anomfin_code_exists')) {
    function anomfin_code_exists(\PDO $pdo, string $code): bool
    {
        $stmt = $pdo->prepare('SELECT 1 FROM short_links WHERE code = :code LIMIT 1');
        $stmt->execute(['code' => $code]);

        return (bool) $stmt->fetchColumn();
    }
}

if (!function_exists('anomfin_purge_expired_db_links')) {
    function anomfin_purge_expired_db_links(\PDO $pdo, int $days): void
    {
        if ($days <= 0) {
            return;
        }

        $threshold = gmdate('Y-m-d H:i:s', time() - ($days * 86400));
        $stmt = $pdo->prepare('DELETE FROM short_links WHERE created_at < :threshold');
        $stmt->execute(['threshold' => $threshold]);
    }
}

if (!function_exists('anomfin_build_short_url')) {
    function anomfin_build_short_url(string $base, string $code): string
    {
        if (str_contains($base, '=') || str_ends_with($base, '/')) {
            return $base . $code;
        }

        return rtrim($base, '/') . '/' . $code;
    }
}

if (!function_exists('anomfin_link_store_path')) {
    function anomfin_link_store_path(): string
    {
        $dir = dirname(__DIR__) . '/data';
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        return $dir . '/short-links.json';
    }
}

if (!function_exists('anomfin_load_link_store')) {
    function anomfin_load_link_store(): array
    {
        $file = anomfin_link_store_path();
        if (!is_file($file)) {
            return [];
        }

        $data = json_decode((string) file_get_contents($file), true);

        return is_array($data) ? $data : [];
    }
}

if (!function_exists('anomfin_save_link_store')) {
    function anomfin_save_link_store(array $links): void
    {
        $file = anomfin_link_store_path();
        $fp = fopen($file, 'c+');
        if ($fp === false) {
            throw new RuntimeException('Lyhennysten tallennus epäonnistui');
        }

        flock($fp, LOCK_EX);
        ftruncate($fp, 0);
        fwrite($fp, json_encode($links, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}

if (!function_exists('anomfin_purge_json_links')) {
    function anomfin_purge_json_links(int $days): void
    {
        if ($days <= 0) {
            return;
        }

        $links = anomfin_load_link_store();
        if ($links === []) {
            return;
        }

        $threshold = time() - ($days * 86400);
        $changed = false;
        foreach ($links as $code => $data) {
            $createdAt = isset($data['created_at']) ? strtotime((string) $data['created_at']) : 0;
            if ($createdAt > 0 && $createdAt < $threshold) {
                unset($links[$code]);
                $changed = true;
            }
        }

        if ($changed) {
            anomfin_save_link_store($links);
        }
    }
}

if (!function_exists('anomfin_ensure_utm_campaign')) {
    function anomfin_ensure_utm_campaign(string $url, string $campaign): string
    {
        $parts = parse_url($url);
        if ($parts === false) {
            return $url;
        }

        $query = [];
        if (!empty($parts['query'])) {
            parse_str($parts['query'], $query);
        }

        $lower = array_change_key_case($query, CASE_LOWER);
        if (array_key_exists('utm_campaign', $lower)) {
            return $url;
        }

        $query['utm_campaign'] = $campaign;
        $parts['query'] = http_build_query($query);

        return anomfin_build_url_from_parts($parts);
    }
}

if (!function_exists('anomfin_build_url_from_parts')) {
    function anomfin_build_url_from_parts(array $parts): string
    {
        $scheme = isset($parts['scheme']) ? $parts['scheme'] . '://' : '';
        $user = $parts['user'] ?? '';
        $pass = isset($parts['pass']) ? ':' . $parts['pass'] : '';
        $auth = $user !== '' ? $user . $pass . '@' : '';
        $host = $parts['host'] ?? '';
        $port = isset($parts['port']) ? ':' . $parts['port'] : '';
        $path = $parts['path'] ?? '';
        $query = isset($parts['query']) && $parts['query'] !== '' ? '?' . $parts['query'] : '';
        $fragment = isset($parts['fragment']) ? '#' . $parts['fragment'] : '';

        return $scheme . $auth . $host . $port . $path . $query . $fragment;
    }
}

if (!function_exists('anomfin_is_duplicate_code_error')) {
    function anomfin_is_duplicate_code_error(\Throwable $throwable): bool
    {
        if (!$throwable instanceof \PDOException) {
            return false;
        }

        $code = $throwable->getCode();
        if ($code === '23000') {
            return true;
        }

        $message = $throwable->getMessage();

        return str_contains($message, '1062') || str_contains($message, 'UNIQUE') || str_contains($message, 'duplicate');
    }
}
