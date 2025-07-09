UPDATE mysql.user SET plugin = 'mysql_native_password' WHERE User = 'root';
ALTER USER 'root'@'localhost' IDENTIFIED BY '{{ mysql_root_password }}';
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
DROP DATABASE IF EXISTS test;
FLUSH PRIVILEGES;