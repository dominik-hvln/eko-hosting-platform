#!/bin/bash
set -e

ACTION=$1
DB_NAME=$2
DB_USER=$3
DB_PASSWORD=$4 # Hasło użytkownika bazy danych
MYSQL_ROOT_PASSWORD=$5 # Hasło roota MariaDB

create_database() {
    echo "--- Tworzenie bazy danych ${DB_NAME} i użytkownika ${DB_USER} ---"

    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<MYSQL_SCRIPT
CREATE DATABASE \`${DB_NAME}\`;
CREATE USER \`${DB_USER}\`@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO \`${DB_USER}\`@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

    echo "Baza danych i użytkownik zostali pomyślnie utworzeni."
}

delete_database() {
    echo "--- Usuwanie bazy danych ${DB_NAME} i użytkownika ${DB_USER} ---"

    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<MYSQL_SCRIPT
DROP DATABASE IF EXISTS \`${DB_NAME}\`;
DROP USER IF EXISTS \`${DB_USER}\`@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

    echo "Baza danych i użytkownik zostali usunięci."
}

case "$ACTION" in
    create)
        if [ -z "$DB_PASSWORD" ] || [ -z "$MYSQL_ROOT_PASSWORD" ]; then
            echo "Błąd: Hasło użytkownika i hasło roota są wymagane."
            exit 1
        fi
        create_database
        ;;
    delete)
        if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
            echo "Błąd: Hasło roota jest wymagane."
            exit 1
        fi
        delete_database
        ;;
    *)
        echo "Użycie: $0 {create|delete} <db_name> <db_user> [db_password] <mysql_root_password>"
        exit 1
        ;;
esac

exit 0
