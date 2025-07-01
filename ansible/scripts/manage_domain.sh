#!/bin/bash
set -e

ACTION=$1
DOMAIN=$2
SYSTEM_USER=$3
PHP_VERSION=$4

VHOST_PATH="/etc/nginx/sites-available"
VHOST_ENABLED_PATH="/etc/nginx/sites-enabled"
WEB_ROOT="/home/${SYSTEM_USER}/domains/${DOMAIN}"

create_vhost() {
    echo "--- Tworzenie vhosta dla domeny ${DOMAIN} ---"

    if [ -f "${VHOST_PATH}/${DOMAIN}" ]; then
        echo "Błąd: Plik konfiguracyjny dla ${DOMAIN} już istnieje."
        exit 1
    fi

    mkdir -p "${WEB_ROOT}"
    chown -R ${SYSTEM_USER}:${SYSTEM_USER} "/home/${SYSTEM_USER}/domains"

    # Generowanie pliku konfiguracyjnego vhost
    cat > "${VHOST_PATH}/${DOMAIN}" <<EOL
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    root ${WEB_ROOT};
    index index.php index.html index.htm;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php${PHP_VERSION}-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOL

    # Aktywacja vhosta i przeładowanie Nginx
    ln -s "${VHOST_PATH}/${DOMAIN}" "${VHOST_ENABLED_PATH}/"
    nginx -t # Sprawdzenie poprawności konfiguracji
    systemctl reload nginx

    echo "Vhost dla ${DOMAIN} został pomyślnie utworzony i aktywowany."
}

change_php_version() {
    echo "--- Zmiana wersji PHP dla domeny ${DOMAIN} na ${PHP_VERSION} ---"

    if [ ! -f "${VHOST_PATH}/${DOMAIN}" ]; then
        echo "Błąd: Plik konfiguracyjny dla ${DOMAIN} nie istnieje."
        exit 1
    fi

    # Używamy sed do podmiany linii z fastcgi_pass
    sed -i "s|fastcgi_pass unix:/var/run/php/php.*-fpm.sock;|fastcgi_pass unix:/var/run/php/php${PHP_VERSION}-fpm.sock;|" "${VHOST_PATH}/${DOMAIN}"

    nginx -t
    systemctl reload nginx

    echo "Wersja PHP została zmieniona na ${PHP_VERSION}."
}

delete_vhost() {
    echo "--- Usuwanie vhosta dla domeny ${DOMAIN} ---"

    if [ ! -f "${VHOST_ENABLED_PATH}/${DOMAIN}" ]; then
        echo "Błąd: Domena ${DOMAIN} nie jest aktywna."
        exit 1
    fi

    rm "${VHOST_ENABLED_PATH}/${DOMAIN}"
    rm "${VHOST_PATH}/${DOMAIN}"

    nginx -t
    systemctl reload nginx

    # Opcjonalnie można też usunąć katalog roota
    # rm -rf ${WEB_ROOT}

    echo "Vhost dla ${DOMAIN} został usunięty."
}


case "$ACTION" in
    create)
        create_vhost
        ;;
    change-php)
        change_php_version
        ;;
    delete)
        delete_vhost
        ;;
    *)
        echo "Użycie: $0 {create|change-php|delete} <domena> <uzytkownik> <wersja_php>"
        exit 1
        ;;
esac

exit 0