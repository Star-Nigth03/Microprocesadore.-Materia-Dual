# Gestion escolar

Este proyecto es una aplicacion web basica para llevar el control escolar de alumnos, materias, inscripciones y calificaciones.

Por ahora el sistema no esta enfocado en el diseno visual. La parte que se trabajo primero fue la logica principal para que el proyecto ya pueda registrar informacion, consultarla y conectarse con una base de datos MySQL.

## Tecnologias usadas

- Kotlin
- Spring Boot
- MySQL
- HTML
- CSS
- JavaScript
- Gradle

## Dependencias y requisitos para ejecutar el proyecto

Para el que desee correr el proyecto en su equipo, necesita tener instalado lo siguiente:

- Java 25
- MySQL
- Gradle Wrapper incluido en el proyecto

Las dependencias principales del backend ya estan declaradas en `build.gradle.kts`:

- `spring-boot-starter-actuator`
- `spring-boot-starter-data-r2dbc`
- `spring-boot-starter-security`
- `spring-boot-starter-validation`
- `spring-boot-starter-webflux`
- `reactor-kotlin-extensions`
- `kotlin-reflect`
- `kotlinx-coroutines-reactor`
- `jackson-module-kotlin`
- `mysql-connector-j`
- `r2dbc-mysql`

Dependencias de prueba:

- `spring-boot-starter-actuator-test`
- `spring-boot-starter-data-r2dbc-test`
- `spring-boot-starter-security-test`
- `spring-boot-starter-validation-test`
- `spring-boot-starter-webflux-test`
- `kotlin-test-junit5`
- `kotlinx-coroutines-test`
- `h2`
- `r2dbc-h2`
- `junit-platform-launcher`

Tambien se deben definir estas variables de entorno antes de ejecutar la aplicacion:

- `DB_USERNAME`
- `DB_PASSWORD`

## Que hace el sistema actualmente

El sistema ya cuenta con una primera version funcional para:

- Registrar, editar y eliminar alumnos.
- Registrar, editar y eliminar materias.
- Inscribir alumnos a materias disponibles.
- Consultar las materias inscritas por alumno.
- Registrar y actualizar calificaciones.
- Calcular el promedio general del alumno.
- Consultar materias inscritas y materias aprobadas.
- Ver el historial academico de cada alumno.
- Consultar estadisticas generales.
- Identificar alumnos con riesgo academico segun sus calificaciones.

## Estado del proyecto

Esta version todavia no esta terminada. Aun falta mejorar el diseno visual, acomodar mejor algunas pantallas y ajustar detalles de visualizacion.

La prioridad de esta entrega fue dejar funcionando la estructura principal del sistema:

- Backend con Spring Boot.
- Frontend basico con HTML, CSS y JavaScript.
- Conexion con MySQL.
- Consultas principales para alumnos, materias, inscripciones y calificaciones.

## Base de datos

La base de datos se llama:

```text
gestor_escolar
```

El script para crear la base y las tablas esta en:

```text
src/main/resources/schema.sql
```

Para crear la base de datos desde MySQL Workbench:

1. Abrir MySQL Workbench.
2. Entrar a la conexion local de MySQL.
3. Abrir una nueva pestaña SQL.
4. Copiar o abrir el contenido de `src/main/resources/schema.sql`.
5. Ejecutar el script.

Para comprobar que se creo correctamente:

```sql
use gestor_escolar;
show tables;
```

Tambien se puede revisar que existan los roles y periodos iniciales:

```sql
select * from roles;
select * from periodos;
```

## Configuracion de la conexion

La configuracion esta en:

```text
src/main/resources/application.properties
```

Debe quedar parecida a esto:

```properties
spring.application.name=gestion-escolar
server.port=8081
spring.r2dbc.url=r2dbc:mysql://localhost:3306/gestor_escolar
spring.r2dbc.username=${DB_USERNAME:root}
spring.r2dbc.password=${DB_PASSWORD:}
```

Para no subir contrasenas a Git, la contrasena de MySQL se manda con una variable de entorno.

En PowerShell se puede configurar asi antes de ejecutar el proyecto:

```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="TU_CONTRASENA_DE_MYSQL"
```

Debe ser la misma contrasena que se usa para entrar a MySQL Workbench.

## Como ejecutar el proyecto

Desde la carpeta del proyecto:

```powershell
.\gradlew.bat bootRun
```

El proyecto esta configurado para usar el puerto `8081`, porque en mi equipo el puerto `8080` ya estaba ocupado.

Cuando la aplicacion inicie, debe aparecer algo parecido a:

```text
Netty started on port 8081
Started GestionEscolarApplicationKt
```

Despues se puede abrir en el navegador:

```text
http://localhost:8081/
```

Tambien se puede probar directamente el backend con:

```text
http://localhost:8081/api/alumnos
```

Si la conexion funciona y aun no hay alumnos, debe responder:

```json
[]
```

## Errores comunes

Si aparece un error relacionado con el puerto, puede ser que la aplicacion ya este corriendo. Se puede revisar con:

```powershell
netstat -ano | Select-String ':8081'
```

Si aparece un error de MySQL, normalmente es por una de estas razones:

- MySQL no esta iniciado.
- La contrasena en `application.properties` no coincide con la de Workbench.
- La base `gestor_escolar` no fue creada.
- No se ejecuto el script `schema.sql`.

Si Gradle muestra un error como `Failed to clean up stale outputs`, normalmente se soluciona cerrando la ejecucion anterior de la app y corriendo:

```powershell
.\gradlew.bat --stop
```

## Pendientes

- Mejorar el diseno visual.
- Ordenar mejor la interfaz.
- Agregar validaciones mas claras para el usuario.
- Mejorar mensajes de error en pantalla.
- Revisar detalles de visualizacion en tablas y formularios.
- Agregar autenticacion real para administradores y alumnos.
