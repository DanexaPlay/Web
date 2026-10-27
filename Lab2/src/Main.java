import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.StringJoiner;
import org.bson.Document;
import com.fastcgi.FCGIInterface;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoCredential;
import com.mongodb.ServerAddress;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoCollection;

import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;

import org.bson.types.ObjectId;

public class Main {
    private static MongoClient client;
    private static MongoCollection<Document> collection;

    public static void main(String[] args) {
        FCGIInterface server = new FCGIInterface();
        connectToDatabase();
        if (System.getProperty("FCGI_PORT") == null) {
            System.setProperty("FCGI_PORT", "9000");
        }
        while (server.FCGIaccept() == 0) { 
            try {
            handleRequest();
        }
    catch (Exception e) {
        e.printStackTrace(System.err);
        sendHttpError("500 Internal Server Error", "Ошибка сервера!");
    }
        }
    }

    public static void handleRequest() {
        long startTime = System.nanoTime();
        String method = System.getProperty("REQUEST_METHOD");
        String uri = System.getProperty("REQUEST_URI");
        String query = System.getProperty("QUERY_STRING");

        if (method == null || uri == null) {
            sendError("Не удалось определить HTTP-запрос!");
            return;
        }

        String path = uri.split("\\?", 2)[0];

        if (path.equals("/points")) {
            if (!method.equals("GET")) {
                sendHttpError("405 Method Not Allowed", "Неподдерживаемый метод!");
                return;
            }

            sendAllPoints();
            return;
        }

        else if (path.equals("/delete")) {
            if (!method.equals("DELETE")) {
                sendHttpError("405 Method Not Allowed", "Неподдерживаемый метод!");
                return;
            }

            if (query == null || !query.matches("id=[0-9a-fA-F]{24}")) {
                sendError("Некорректный ID точки!");
                return;
            }

            String id = query.substring(3);

            deletePoint(id);

            System.out.print("Status: 204 No Content\r\n\r\n");
            System.out.flush();
            return;
        }

        else if (path.equals("/check")) {
            if (query == null || query.isBlank()) {
            sendError("Пустой запрос!");
            return;
        }
            if (!method.equals("GET")) {
                sendHttpError("405 Method Not Allowed", "Неподдерживаемый метод!");
                return;
            }
        }

        else {
            sendHttpError("404 Not Found", "Неизвестный маршрут!");
            return;
        }
        String[] values = query.split("&");
        Map<String, Double> variables = new HashMap<>();
            for (String i : values) {
                try {
                String[] j = i.split("=");
                if (j.length != 2) {
                    sendError("Неправильно переданы значения!");
                    return;
                }
                Double v = Double.parseDouble(j[1]);
                if (!Double.isFinite(v)) {
                    sendError("Один из аргументов бесконечность или не число!");
                    return;
                }
                if (variables.containsKey(j[0])) {
                    sendError("Один из аргументов повторяется!");
                    return;
                }
                variables.put(j[0], v);
                }

                catch (NullPointerException e1) {
                    sendError("Не передано одно из значений!");
                    return;

                }
                catch (NumberFormatException e2) {
                    sendError("Один из аргументов не является числом!");
                    return;

                }
                catch (IndexOutOfBoundsException e3) {
                    sendError("Один из аргументов не был передан!");
                    return;
                }

            }
            if (!variables.containsKey("x") || !variables.containsKey("y") || !variables.containsKey("r")) {
                sendError("Один из аргументов не был передан!");
                return;
            }

            double x = variables.get("x");
            double y = variables.get("y");
            double r = variables.get("r");

            if (r <= 0) {
                sendError("Радиус должен быть положительным!");
                return;
            }

            boolean hit = check(x, y, r);
            long timestamp = Instant.now().getEpochSecond();
            double executionTime = (System.nanoTime() - startTime) / 1_000_000.0;
            System.err.println("Начинаем сохранение точки");
            String id = addPoint(x, y, r, hit, timestamp, executionTime);
            System.err.println("Точка сохранена, ID: " + id);
            sendResponse(id, x, y, r, hit, timestamp, executionTime);
        }

    public static void sendResponse(String id, Double x, Double y, Double r, boolean hit, long timestamp, double executionTime) {
        String json = "{\"id\":\"" + id + "\",\"x\":" + x + ",\"y\":" + y + ",\"r\":" + r + ",\"hit\":" + hit + ",\"timestamp\":" + timestamp + ",\"executionTime\":" + executionTime + "}";
        System.out.print("Content-Type: application/json; charset=UTF-8\r\n\r\n");

        System.out.print(json);
        System.out.flush();
}

    public static void sendError(String message) {
        System.out.print(
            "Status: 400 Bad Request\r\n" +
            "Content-Type: text/plain; charset=UTF-8\r\n\r\n"
        );

        System.out.print(message);
        System.out.flush();
    }

    public static void sendHttpError(String status, String message) {
        System.out.print(
            "Status: " + status + "\r\n" +
            "Content-Type: text/plain; charset=UTF-8\r\n\r\n"
        );

        System.out.print(message);
        System.out.flush();
}

    public static boolean check(double x, double y, double r) {
        if (x >= 0 && y >= 0 && y <= -2 * x + r) {
            return true;
        }
        else if (x <= 0 && y >= 0 && x >= -r && y <= r / 2) {
            return true;
        }
        else if (x <= 0 && y <= 0 && x * x + y * y <= r * r / 4) {
            return true;
        }
        else {
            return false;
        }
    }

    public static void connectToDatabase() {
        String user = System.getenv("MONGO_USER");
        String password = System.getenv("MONGO_PASSWORD");

        if (user == null || password == null) {
            throw new IllegalStateException("Не найдены настройки MongoDB");
        }

        MongoClientSettings settings = MongoClientSettings.builder()
                .applyToClusterSettings(builder ->
                        builder.hosts(Collections.singletonList(
                                new ServerAddress("127.0.0.1", 27017)
                        )))
                .credential(MongoCredential.createCredential(
                        user, "admin", password.toCharArray()
                ))
                .build();

        client = MongoClients.create(settings);
        MongoDatabase database = client.getDatabase("web_lab2");
        database.runCommand(new Document("ping", 1));
        collection = database.getCollection("points");

        System.err.println("Подключение к MongoDB успешно!");
}
    public static String addPoint(Double x, Double y, Double r, boolean hit, long timestamp, double executionTime) {
        Document point = new Document("x", x)
        .append("y", y)
        .append("r", r)
        .append("hit", hit)
        .append("timestamp", timestamp)
        .append("executionTime", executionTime);
        collection.insertOne(point);
        String id = point.getObjectId("_id").toHexString();
        return id;
    }

    public static Document findPoint(String id) {
        Document point = collection.find(Filters.eq("_id", new ObjectId(id))).first();
        return point;
    }

    public static void deletePoint(String id) {
        collection.deleteOne(Filters.eq("_id", new ObjectId(id)));
    }

    public static void sendAllPoints() {
        StringJoiner json = new StringJoiner(",", "[", "]");

        for (Document point : collection.find().sort(Sorts.ascending("timestamp"))) {
            Document result = new Document("id", point.getObjectId("_id").toHexString())
                    .append("x", point.get("x"))
                    .append("y", point.get("y"))
                    .append("r", point.get("r"))
                    .append("hit", point.get("hit"))
                    .append("timestamp", point.get("timestamp"))
                    .append("executionTime", point.get("executionTime"));

            json.add(result.toJson());
        }

        System.out.print("Content-Type: application/json; charset=UTF-8\r\n\r\n");
        System.out.print(json.toString());
        System.out.flush();
    }
}