openssl req -x509 -newkey rsa:2048 -keyout ssl_key.pem -out ssl_cert.pem -days 1001 -passout pass:password -subj "/C=ID/O=Wello Soft/OU=Bandit/L=Bandit/ST=Bandit/CN=Wello Soft"
openssl x509 -outform der -in ssl_cert.pem -out ssl_cert.crt
