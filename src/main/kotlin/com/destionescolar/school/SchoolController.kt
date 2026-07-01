package com.destionescolar.school

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api")
class ControladorEscolar(private val service: ServicioEscolar) {

    @GetMapping("/alumnos")
    fun listarAlumnos(): Flux<Alumno> = service.listarAlumnos()

    @PostMapping("/alumnos")
    @ResponseStatus(HttpStatus.CREATED)
    fun crearAlumno(@Valid @RequestBody solicitud: SolicitudAlumno): Mono<Alumno> = service.crearAlumno(solicitud)

    @PutMapping("/alumnos/{id}")
    fun actualizarAlumno(@PathVariable id: Long, @Valid @RequestBody solicitud: SolicitudAlumno): Mono<Alumno> =
        service.actualizarAlumno(id, solicitud)

    @DeleteMapping("/alumnos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun eliminarAlumno(@PathVariable id: Long): Mono<Void> = service.eliminarAlumno(id)

    @GetMapping("/materias")
    fun listarMaterias(): Flux<Materia> = service.listarMaterias()

    @PostMapping("/materias")
    @ResponseStatus(HttpStatus.CREATED)
    fun crearMateria(@Valid @RequestBody solicitud: SolicitudMateria): Mono<Materia> = service.crearMateria(solicitud)

    @PutMapping("/materias/{id}")
    fun actualizarMateria(@PathVariable id: Long, @Valid @RequestBody solicitud: SolicitudMateria): Mono<Materia> =
        service.actualizarMateria(id, solicitud)

    @DeleteMapping("/materias/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun eliminarMateria(@PathVariable id: Long): Mono<Void> = service.eliminarMateria(id)

    @PostMapping("/inscripciones")
    @ResponseStatus(HttpStatus.CREATED)
    fun inscribirAlumno(@RequestBody solicitud: SolicitudInscripcion): Mono<DetalleInscripcion> = service.inscribirAlumno(solicitud)

    @GetMapping("/alumnos/{id}/materias")
    fun listarMateriasDelAlumno(@PathVariable id: Long): Flux<DetalleInscripcion> = service.listarInscripcionesPorAlumno(id)

    @PutMapping("/inscripciones/{id}/calificacion")
    fun actualizarCalificacion(@PathVariable id: Long, @Valid @RequestBody solicitud: SolicitudCalificacion): Mono<DetalleInscripcion> =
        service.actualizarCalificacion(id, solicitud)

    @GetMapping("/alumnos/{id}/resumen")
    fun resumenAlumno(@PathVariable id: Long): Mono<ResumenAlumno> = service.resumenAlumno(id)

    @GetMapping("/alumnos/{id}/historial")
    fun historialAcademico(@PathVariable id: Long): Mono<HistorialAcademico> = service.historialAcademico(id)

    @GetMapping("/estadisticas")
    fun estadisticasRendimiento(): Mono<EstadisticasRendimiento> = service.estadisticasRendimiento()

    @GetMapping("/riesgo-academico")
    fun alumnosEnRiesgo(): Flux<ResumenAlumno> = service.alumnosEnRiesgo()
}
