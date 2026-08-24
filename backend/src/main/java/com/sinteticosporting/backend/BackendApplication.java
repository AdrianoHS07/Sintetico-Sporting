package com.sinteticosporting.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
/*
package com.sinteticosporting.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import javax.sql.DataSource;
import java.sql.Connection;

@SpringBootApplication
public class BackendApplication implements CommandLineRunner {

    private final DataSource dataSource;

    public BackendApplication(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {

        try (Connection connection = dataSource.getConnection()) {

            System.out.println("=================================");
            System.out.println("CONEXION EXITOSA A MYSQL");
            System.out.println("URL: " + connection.getMetaData().getURL());
            System.out.println("=================================");

        } catch (Exception e) {

            System.out.println("=================================");
            System.out.println("ERROR DE CONEXION");
            System.out.println(e.getMessage());
            System.out.println("=================================");

        }
    }
}
*/