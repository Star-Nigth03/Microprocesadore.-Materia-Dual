package com.destionescolar.school

import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

data class Alumno(
    val id: Long? = null,
    val matricula: String,
    val nombre: String,
    val email: String? = null,
)

data class SolicitudAlumno(
    @field:NotBlank val matricula: String,
    @field:NotBlank val nombre: String,
    @field:Email val email: String? = null,
)

data class Materia(
    val id: Long? = null,
    val clave: String,
    val nombre: String,
    val horario: String,
)

data class SolicitudMateria(
    @field:NotBlank val clave: String,
    @field:NotBlank val nombre: String,
    @field:NotBlank val horario: String,
)

data class SolicitudInscripcion(
    val alumnoId: Long,
    val materiaId: Long,
)

data class SolicitudCalificacion(
    @field:DecimalMin("0.0") @field:DecimalMax("10.0") val calificacion: Double,
)

data class DetalleInscripcion(
    val id: Long,
    val alumnoId: Long,
    val materiaId: Long,
    val materiaClave: String,
    val materiaNombre: String,
    val horario: String,
    val calificacion: Double?,
    val aprobada: Boolean,
)

data class ResumenAlumno(
    val alumno: Alumno,
    val totalMaterias: Long,
    val materiasAprobadas: Long,
    val promedioGeneral: Double?,
    val enRiesgoAcademico: Boolean,
)

data class HistorialAcademico(
    val resumen: ResumenAlumno,
    val materias: List<DetalleInscripcion>,
)

data class EstadisticasRendimiento(
    val totalAlumnos: Long,
    val totalMaterias: Long,
    val totalInscripciones: Long,
    val promedioGeneral: Double?,
    val alumnosEnRiesgo: Long,
    val alumnosAprobados: Long,
)
