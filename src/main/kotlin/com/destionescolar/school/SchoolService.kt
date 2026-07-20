package com.destionescolar.school

import org.springframework.dao.DuplicateKeyException
import org.springframework.http.HttpStatus
import org.springframework.r2dbc.core.DatabaseClient
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Service
class ServicioEscolar(private val database: DatabaseClient) {

    fun listarAlumnos(): Flux<Alumno> =
        database.sql(consultaAlumnos("order by u.nombre"))
            .map { row, _ -> row.aAlumno() }
            .all()

    fun crearAlumno(solicitud: SolicitudAlumno): Mono<Alumno> =
        buscarRolAlumnoId()
            .flatMap { rolId ->
                database.sql(
                    """
                    insert into usuarios (rol_id, nombre, email, password)
                    values (:rolId, :nombre, :email, :password)
                    """.trimIndent(),
                )
                    .bind("rolId", rolId)
                    .bind("nombre", solicitud.nombre.trim())
                    .bind("email", solicitud.email?.trim().orVacioParaCorreo(solicitud.matricula))
                    .bind("password", "temporal123")
                    .fetch()
                    .rowsUpdated()
            }
            .then(buscarUsuarioIdPorEmail(solicitud.email?.trim().orVacioParaCorreo(solicitud.matricula)))
            .flatMap { usuarioId ->
                database.sql(
                    """
                    insert into alumnos (usuario_id, matricula)
                    values (:usuarioId, :matricula)
                    """.trimIndent(),
                )
                    .bind("usuarioId", usuarioId)
                    .bind("matricula", solicitud.matricula.trim())
                    .fetch()
                    .rowsUpdated()
            }
            .then(buscarAlumnoPorMatricula(solicitud.matricula.trim()))
            .onErrorMap(DuplicateKeyException::class.java) {
                ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un alumno con esa matricula o email")
            }

    fun actualizarAlumno(id: Long, solicitud: SolicitudAlumno): Mono<Alumno> =
        buscarAlumnoPorId(id)
            .then(
                database.sql(
                    """
                    update usuarios u
                    join alumnos a on a.usuario_id = u.id
                    set u.nombre = :nombre,
                        u.email = :email,
                        a.matricula = :matricula
                    where a.id = :id
                    """.trimIndent(),
                )
                    .bind("id", id)
                    .bind("matricula", solicitud.matricula.trim())
                    .bind("nombre", solicitud.nombre.trim())
                    .bind("email", solicitud.email?.trim().orVacioParaCorreo(solicitud.matricula))
                    .fetch()
                    .rowsUpdated(),
            )
            .then(buscarAlumnoPorId(id))
            .onErrorMap(DuplicateKeyException::class.java) {
                ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un alumno con esa matricula o email")
            }

    fun eliminarAlumno(id: Long): Mono<Void> =
        buscarUsuarioIdPorAlumnoId(id)
            .flatMap { usuarioId ->
                database.sql("delete from usuarios where id = :usuarioId")
                    .bind("usuarioId", usuarioId)
                    .fetch()
                    .rowsUpdated()
            }
            .then()

    fun listarMaterias(): Flux<Materia> =
        database.sql("select id, clave, nombre, horario from materias where activa = true order by nombre")
            .map { row, _ -> row.aMateria() }
            .all()

    fun crearMateria(solicitud: SolicitudMateria): Mono<Materia> =
        database.sql(
            """
            insert into materias (clave, nombre, horario)
            values (:clave, :nombre, :horario)
            """.trimIndent(),
        )
            .bind("clave", solicitud.clave.trim())
            .bind("nombre", solicitud.nombre.trim())
            .bind("horario", solicitud.horario.trim())
            .fetch()
            .rowsUpdated()
            .then(buscarMateriaPorClave(solicitud.clave.trim()))
            .onErrorMap(DuplicateKeyException::class.java) {
                ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una materia con esa clave")
            }

    fun actualizarMateria(id: Long, solicitud: SolicitudMateria): Mono<Materia> =
        database.sql(
            """
            update materias
            set clave = :clave, nombre = :nombre, horario = :horario
            where id = :id
            """.trimIndent(),
        )
            .bind("id", id)
            .bind("clave", solicitud.clave.trim())
            .bind("nombre", solicitud.nombre.trim())
            .bind("horario", solicitud.horario.trim())
            .fetch()
            .rowsUpdated()
            .flatMap { actualizados ->
                if (actualizados == 0L) Mono.error(noEncontrado("Materia no encontrada")) else buscarMateriaPorId(id)
            }
            .onErrorMap(DuplicateKeyException::class.java) {
                ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una materia con esa clave")
            }

    fun eliminarMateria(id: Long): Mono<Void> =
        database.sql("update materias set activa = false where id = :id")
            .bind("id", id)
            .fetch()
            .rowsUpdated()
            .then()

    fun inscribirAlumno(solicitud: SolicitudInscripcion): Mono<DetalleInscripcion> =
        Mono.zip(buscarAlumnoPorId(solicitud.alumnoId), buscarMateriaPorId(solicitud.materiaId), buscarPeriodoActivoId())
            .flatMap { tupla ->
                database.sql(
                    """
                    insert into inscripciones (alumno_id, materia_id, periodo_id)
                    values (:alumnoId, :materiaId, :periodoId)
                    """.trimIndent(),
                )
                    .bind("alumnoId", tupla.t1.id ?: solicitud.alumnoId)
                    .bind("materiaId", tupla.t2.id ?: solicitud.materiaId)
                    .bind("periodoId", tupla.t3)
                    .fetch()
                    .rowsUpdated()
                    .then(buscarInscripcionPorAlumnoYMateria(solicitud.alumnoId, solicitud.materiaId, tupla.t3))
            }
            .onErrorMap(DuplicateKeyException::class.java) {
                ResponseStatusException(HttpStatus.CONFLICT, "El alumno ya esta inscrito en esa materia durante el periodo activo")
            }

    fun listarInscripcionesPorAlumno(alumnoId: Long): Flux<DetalleInscripcion> =
        database.sql(consultaInscripciones("where i.alumno_id = :alumnoId order by p.fecha_inicio desc, m.nombre"))
            .bind("alumnoId", alumnoId)
            .map { row, _ -> row.aDetalleInscripcion() }
            .all()

    fun actualizarCalificacion(inscripcionId: Long, solicitud: SolicitudCalificacion): Mono<DetalleInscripcion> {
        val estado = if (solicitud.calificacion >= CALIFICACION_APROBATORIA) "APROBADA" else "REPROBADA"
        return buscarInscripcionPorId(inscripcionId)
            .then(
                database.sql(
                    """
                    insert into calificaciones (inscripcion_id, calificacion)
                    values (:inscripcionId, :calificacion)
                    on duplicate key update calificacion = values(calificacion)
                    """.trimIndent(),
                )
                    .bind("inscripcionId", inscripcionId)
                    .bind("calificacion", solicitud.calificacion)
                    .fetch()
                    .rowsUpdated(),
            )
            .then(
                database.sql("update inscripciones set estado = :estado where id = :id")
                    .bind("estado", estado)
                    .bind("id", inscripcionId)
                    .fetch()
                    .rowsUpdated(),
            )
            .then(buscarInscripcionPorId(inscripcionId))
    }

    fun resumenAlumno(alumnoId: Long): Mono<ResumenAlumno> =
        Mono.zip(buscarAlumnoPorId(alumnoId), listarInscripcionesPorAlumno(alumnoId).collectList())
            .map { tupla -> crearResumen(tupla.t1, tupla.t2) }

    fun historialAcademico(alumnoId: Long): Mono<HistorialAcademico> =
        Mono.zip(resumenAlumno(alumnoId), listarInscripcionesPorAlumno(alumnoId).collectList())
            .map { tupla -> HistorialAcademico(tupla.t1, tupla.t2) }

    fun estadisticasRendimiento(): Mono<EstadisticasRendimiento> =
        Mono.zip(listarAlumnos().collectList(), listarMaterias().collectList(), listarTodasLasInscripciones().collectList())
            .map { tupla ->
                val alumnos = tupla.t1
                val materias = tupla.t2
                val inscripciones = tupla.t3
                val calificaciones = inscripciones.mapNotNull { it.calificacion }
                val resumenes = alumnos.map { alumno ->
                    crearResumen(alumno, inscripciones.filter { it.alumnoId == alumno.id })
                }
                EstadisticasRendimiento(
                    totalAlumnos = alumnos.size.toLong(),
                    totalMaterias = materias.size.toLong(),
                    totalInscripciones = inscripciones.size.toLong(),
                    promedioGeneral = calificaciones.promedioONulo(),
                    alumnosEnRiesgo = resumenes.count { it.enRiesgoAcademico }.toLong(),
                    alumnosAprobados = resumenes.count { (it.promedioGeneral ?: 0.0) >= CALIFICACION_APROBATORIA }.toLong(),
                )
            }

    fun alumnosEnRiesgo(): Flux<ResumenAlumno> =
        Mono.zip(listarAlumnos().collectList(), listarTodasLasInscripciones().collectList())
            .flatMapMany { tupla ->
                Flux.fromIterable(
                    tupla.t1
                        .map { alumno -> crearResumen(alumno, tupla.t2.filter { it.alumnoId == alumno.id }) }
                        .filter { it.enRiesgoAcademico },
                )
            }

    private fun listarTodasLasInscripciones(): Flux<DetalleInscripcion> =
        database.sql(consultaInscripciones("order by i.alumno_id, p.fecha_inicio desc, m.nombre"))
            .map { row, _ -> row.aDetalleInscripcion() }
            .all()

    private fun buscarAlumnoPorId(id: Long): Mono<Alumno> =
        database.sql(consultaAlumnos("where a.id = :id"))
            .bind("id", id)
            .map { row, _ -> row.aAlumno() }
            .one()
            .switchIfEmpty(Mono.error(noEncontrado("Alumno no encontrado")))

    private fun buscarAlumnoPorMatricula(matricula: String): Mono<Alumno> =
        database.sql(consultaAlumnos("where a.matricula = :matricula"))
            .bind("matricula", matricula)
            .map { row, _ -> row.aAlumno() }
            .one()

    private fun buscarMateriaPorId(id: Long): Mono<Materia> =
        database.sql("select id, clave, nombre, horario from materias where id = :id and activa = true")
            .bind("id", id)
            .map { row, _ -> row.aMateria() }
            .one()
            .switchIfEmpty(Mono.error(noEncontrado("Materia no encontrada")))

    private fun buscarMateriaPorClave(clave: String): Mono<Materia> =
        database.sql("select id, clave, nombre, horario from materias where clave = :clave")
            .bind("clave", clave)
            .map { row, _ -> row.aMateria() }
            .one()

    private fun buscarInscripcionPorId(id: Long): Mono<DetalleInscripcion> =
        database.sql(consultaInscripciones("where i.id = :id"))
            .bind("id", id)
            .map { row, _ -> row.aDetalleInscripcion() }
            .one()
            .switchIfEmpty(Mono.error(noEncontrado("Inscripcion no encontrada")))

    private fun buscarInscripcionPorAlumnoYMateria(alumnoId: Long, materiaId: Long, periodoId: Long): Mono<DetalleInscripcion> =
        database.sql(consultaInscripciones("where i.alumno_id = :alumnoId and i.materia_id = :materiaId and i.periodo_id = :periodoId"))
            .bind("alumnoId", alumnoId)
            .bind("materiaId", materiaId)
            .bind("periodoId", periodoId)
            .map { row, _ -> row.aDetalleInscripcion() }
            .one()

    private fun buscarRolAlumnoId(): Mono<Long> =
        database.sql("select id from roles where nombre = 'ALUMNO'")
            .map { row, _ -> row.get("id", java.lang.Long::class.java)?.toLong() ?: 0 }
            .one()
            .switchIfEmpty(Mono.error(noEncontrado("Rol ALUMNO no encontrado")))

    private fun buscarPeriodoActivoId(): Mono<Long> =
        database.sql("select id from periodos where activo = true order by fecha_inicio desc limit 1")
            .map { row, _ -> row.get("id", java.lang.Long::class.java)?.toLong() ?: 0 }
            .one()
            .switchIfEmpty(Mono.error(noEncontrado("No hay un periodo activo")))

    private fun buscarUsuarioIdPorEmail(email: String): Mono<Long> =
        database.sql("select id from usuarios where email = :email")
            .bind("email", email)
            .map { row, _ -> row.get("id", java.lang.Long::class.java)?.toLong() ?: 0 }
            .one()

    private fun buscarUsuarioIdPorAlumnoId(alumnoId: Long): Mono<Long> =
        database.sql("select usuario_id from alumnos where id = :alumnoId")
            .bind("alumnoId", alumnoId)
            .map { row, _ -> row.get("usuario_id", java.lang.Long::class.java)?.toLong() ?: 0 }
            .one()
            .switchIfEmpty(Mono.error(noEncontrado("Alumno no encontrado")))

    private fun crearResumen(alumno: Alumno, inscripciones: List<DetalleInscripcion>): ResumenAlumno {
        val calificaciones = inscripciones.mapNotNull { it.calificacion }
        val promedio = calificaciones.promedioONulo()
        return ResumenAlumno(
            alumno = alumno,
            totalMaterias = inscripciones.size.toLong(),
            materiasAprobadas = inscripciones.count { it.aprobada }.toLong(),
            promedioGeneral = promedio,
            enRiesgoAcademico = calificaciones.isNotEmpty() &&
                (promedio == null || promedio < CALIFICACION_APROBATORIA || calificaciones.any { it < CALIFICACION_APROBATORIA }),
        )
    }

    private fun consultaAlumnos(sufijo: String): String =
        """
        select a.id,
               a.matricula,
               u.nombre,
               u.email
        from alumnos a
        join usuarios u on u.id = a.usuario_id
        $sufijo
        """.trimIndent()

    private fun consultaInscripciones(sufijo: String): String =
        """
        select i.id,
               i.alumno_id,
               i.materia_id,
               m.clave as materia_clave,
               m.nombre as materia_nombre,
               m.horario,
               c.calificacion,
               i.estado
        from inscripciones i
        join materias m on m.id = i.materia_id
        join periodos p on p.id = i.periodo_id
        left join calificaciones c on c.inscripcion_id = i.id
        $sufijo
        """.trimIndent()

    private fun noEncontrado(mensaje: String) = ResponseStatusException(HttpStatus.NOT_FOUND, mensaje)

    companion object {
        const val CALIFICACION_APROBATORIA = 6.0
    }
}

private fun String?.orVacioParaCorreo(matricula: String): String =
    if (isNullOrBlank()) "$matricula@gestion-escolar.local" else this

private fun List<Double>.promedioONulo(): Double? = if (isEmpty()) null else average()

private fun io.r2dbc.spi.Row.aAlumno() = Alumno(
    id = get("id", java.lang.Long::class.java)?.toLong(),
    matricula = get("matricula", String::class.java).orEmpty(),
    nombre = get("nombre", String::class.java).orEmpty(),
    email = get("email", String::class.java),
)

private fun io.r2dbc.spi.Row.aMateria() = Materia(
    id = get("id", java.lang.Long::class.java)?.toLong(),
    clave = get("clave", String::class.java).orEmpty(),
    nombre = get("nombre", String::class.java).orEmpty(),
    horario = get("horario", String::class.java).orEmpty(),
)

private fun io.r2dbc.spi.Row.aDetalleInscripcion(): DetalleInscripcion {
    val calificacion = get("calificacion", java.lang.Double::class.java)?.toDouble()
    val estado = get("estado", String::class.java).orEmpty()
    return DetalleInscripcion(
        id = get("id", java.lang.Long::class.java)?.toLong() ?: 0,
        alumnoId = get("alumno_id", java.lang.Long::class.java)?.toLong() ?: 0,
        materiaId = get("materia_id", java.lang.Long::class.java)?.toLong() ?: 0,
        materiaClave = get("materia_clave", String::class.java).orEmpty(),
        materiaNombre = get("materia_nombre", String::class.java).orEmpty(),
        horario = get("horario", String::class.java).orEmpty(),
        calificacion = calificacion,
        aprobada = estado == "APROBADA" || (calificacion != null && calificacion >= ServicioEscolar.CALIFICACION_APROBATORIA),
    )
}
