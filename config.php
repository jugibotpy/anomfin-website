<?php
declare(strict_types=1);

function anomfin_get_db_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $defaults = [
        'host' => getenv('ANOMFIN_DB_HOST') ?: '127.0.0.1',
        'port' => (int) (getenv('ANOMFIN_DB_PORT') ?: 3306),
        'database' => getenv('ANOMFIN_DB_NAME') ?: 'anomfin',
        'username' => getenv('ANOMFIN_DB_USER') ?: 'anomfin',
        'password' => getenv('ANOMFIN_DB_PASS') ?: '',
        'charset' => 'utf8mb4',
        'options' => [],
    ];

    $iniPath = __DIR__ . '/config/database.ini';
    if (is_file($iniPath)) {
        $parsed = parse_ini_file($iniPath, false, INI_SCANNER_TYPED);
        if (is_array($parsed)) {
            $defaults = array_merge($defaults, $parsed);
        }
    }

    $config = $defaults;
    return $config;
}

function anomfin_get_pdo(): ?\PDO
{
    static $pdo = null;
    if ($pdo instanceof \PDO) {
        return $pdo;
    }

    $config = anomfin_get_db_config();
    if (empty($config['host']) || empty($config['database'])) {
        return null;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $config['host'],
        $config['port'],
        $config['database'],
        $config['charset'] ?? 'utf8mb4'
    );

    $options = [
        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
        \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
        \PDO::ATTR_EMULATE_PREPARES => false,
    ];

    if (!empty($config['options']) && is_array($config['options'])) {
        $options = $config['options'] + $options;
    }

    try {
        $pdo = new \PDO(
            $dsn,
            (string) ($config['username'] ?? ''),
            (string) ($config['password'] ?? ''),
            $options
        );
    } catch (\PDOException $exception) {
        error_log('AnomFIN database connection failed: ' . $exception->getMessage());
        $pdo = null;
    }

    return $pdo;
}

function anomfin_database_available(): bool
{
    return anomfin_get_pdo() instanceof \PDO;
}
