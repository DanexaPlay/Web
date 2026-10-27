Лабораторная №2 + доп хранение в MongoDB
Вариант 798
Лыба Данил P3210 ИСУ 501162

Запуск ДБ: docker compose up -d
Запуск Java сервера: cd /home/Web/Lab2
  set -a
  . ./.env
  set +a
  
  javac -cp "lib/*" -d out src/Main.java
  java -DFCGI_PORT=9000 -cp "out:lib/*" Main
Запуск Apache: sudo service apache2 start

Адрес: http://localhost/lab2/lab2.html
