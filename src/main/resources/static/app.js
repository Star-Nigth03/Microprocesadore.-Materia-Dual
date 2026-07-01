const api = {
    alumnos: "/api/alumnos",
    materias: "/api/materias",
    inscripciones: "/api/inscripciones",
    estadisticas: "/api/estadisticas",
    riesgo: "/api/riesgo-academico",
};

let alumnos = [];
let materias = [];

const $ = (id) => document.getElementById(id);
const textoCalificacion = (valor) => valor === null || valor === undefined ? "Sin calificacion" : Number(valor).toFixed(2);

async function solicitud(url, opciones = {}) {
    const respuesta = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...opciones,
    });

    if (!respuesta.ok) {
        let mensaje = `Error ${respuesta.status}`;
        try {
            const cuerpo = await respuesta.json();
            mensaje = cuerpo.detail || cuerpo.message || mensaje;
        } catch {
            // El servidor puede devolver una respuesta vacia en algunos errores.
        }
        throw new Error(mensaje);
    }

    if (respuesta.status === 204) {
        return null;
    }

    return respuesta.json();
}

function mostrarMensaje(mensaje) {
    $("mensaje").textContent = mensaje;
}

async function cargarAlumnos() {
    alumnos = await solicitud(api.alumnos);
    $("alumnos-table").innerHTML = alumnos.map((alumno) => `
        <tr>
            <td>${alumno.matricula}</td>
            <td>${alumno.nombre}</td>
            <td>${alumno.email || ""}</td>
            <td>
                <button type="button" onclick="editarAlumno(${alumno.id})">Editar</button>
                <button type="button" onclick="eliminarAlumno(${alumno.id})">Eliminar</button>
            </td>
        </tr>
    `).join("");

    const opciones = alumnos.map((alumno) => `<option value="${alumno.id}">${alumno.matricula} - ${alumno.nombre}</option>`).join("");
    $("inscripcion-alumno").innerHTML = opciones;
    $("historial-alumno").innerHTML = opciones;
}

async function cargarMaterias() {
    materias = await solicitud(api.materias);
    $("materias-table").innerHTML = materias.map((materia) => `
        <tr>
            <td>${materia.clave}</td>
            <td>${materia.nombre}</td>
            <td>${materia.creditos}</td>
            <td>
                <button type="button" onclick="editarMateria(${materia.id})">Editar</button>
                <button type="button" onclick="eliminarMateria(${materia.id})">Eliminar</button>
            </td>
        </tr>
    `).join("");

    $("inscripcion-materia").innerHTML = materias
        .map((materia) => `<option value="${materia.id}">${materia.clave} - ${materia.nombre}</option>`)
        .join("");
}

function editarAlumno(id) {
    const alumno = alumnos.find((registro) => registro.id === id);
    $("alumno-id").value = alumno.id;
    $("alumno-matricula").value = alumno.matricula;
    $("alumno-nombre").value = alumno.nombre;
    $("alumno-email").value = alumno.email || "";
}

async function eliminarAlumno(id) {
    await solicitud(`${api.alumnos}/${id}`, { method: "DELETE" });
    await actualizarCatalogos();
    mostrarMensaje("Alumno eliminado");
}

function editarMateria(id) {
    const materia = materias.find((registro) => registro.id === id);
    $("materia-id").value = materia.id;
    $("materia-clave").value = materia.clave;
    $("materia-nombre").value = materia.nombre;
    $("materia-creditos").value = materia.creditos;
}

async function eliminarMateria(id) {
    await solicitud(`${api.materias}/${id}`, { method: "DELETE" });
    await actualizarCatalogos();
    mostrarMensaje("Materia eliminada");
}

async function cargarHistorial() {
    const alumnoId = $("historial-alumno").value;
    if (!alumnoId) {
        $("alumno-resumen").textContent = "Registra un alumno para consultar historial.";
        $("historial-table").innerHTML = "";
        return;
    }

    const historial = await solicitud(`${api.alumnos}/${alumnoId}/historial`);
    const resumen = historial.resumen;
    $("alumno-resumen").textContent =
        `Promedio: ${textoCalificacion(resumen.promedioGeneral)} | Materias: ${resumen.totalMaterias} | ` +
        `Aprobadas: ${resumen.materiasAprobadas} | Riesgo academico: ${resumen.enRiesgoAcademico ? "Si" : "No"}`;

    $("historial-table").innerHTML = historial.materias.map((registro) => `
        <tr>
            <td>${registro.materiaClave} - ${registro.materiaNombre}</td>
            <td>${registro.creditos}</td>
            <td><input id="calificacion-${registro.id}" type="number" min="0" max="100" step="0.01" value="${registro.calificacion ?? ""}"></td>
            <td>${registro.aprobada ? "Aprobada" : "No aprobada"}</td>
            <td><button type="button" onclick="guardarCalificacion(${registro.id})">Guardar</button></td>
        </tr>
    `).join("");
}

async function guardarCalificacion(inscripcionId) {
    const valor = Number($(`calificacion-${inscripcionId}`).value);
    await solicitud(`${api.inscripciones}/${inscripcionId}/calificacion`, {
        method: "PUT",
        body: JSON.stringify({ calificacion: valor }),
    });
    await cargarHistorial();
    mostrarMensaje("Calificacion actualizada");
}

async function cargarEstadisticas() {
    const estadisticas = await solicitud(api.estadisticas);
    $("estadisticas").innerHTML = `
        <p>Total alumnos: ${estadisticas.totalAlumnos}</p>
        <p>Total materias: ${estadisticas.totalMaterias}</p>
        <p>Total inscripciones: ${estadisticas.totalInscripciones}</p>
        <p>Promedio general: ${textoCalificacion(estadisticas.promedioGeneral)}</p>
        <p>Alumnos aprobados por promedio: ${estadisticas.alumnosAprobados}</p>
        <p>Alumnos en riesgo: ${estadisticas.alumnosEnRiesgo}</p>
    `;
}

async function cargarRiesgo() {
    const riesgo = await solicitud(api.riesgo);
    $("riesgo-table").innerHTML = riesgo.map((registro) => `
        <tr>
            <td>${registro.alumno.matricula}</td>
            <td>${registro.alumno.nombre}</td>
            <td>${textoCalificacion(registro.promedioGeneral)}</td>
            <td>${registro.totalMaterias}</td>
            <td>${registro.materiasAprobadas}</td>
        </tr>
    `).join("");
}

async function actualizarCatalogos() {
    await Promise.all([cargarAlumnos(), cargarMaterias()]);
}

$("alumno-form").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const id = $("alumno-id").value;
    const cuerpo = {
        matricula: $("alumno-matricula").value,
        nombre: $("alumno-nombre").value,
        email: $("alumno-email").value || null,
    };
    await solicitud(id ? `${api.alumnos}/${id}` : api.alumnos, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(cuerpo),
    });
    evento.target.reset();
    $("alumno-id").value = "";
    await actualizarCatalogos();
    mostrarMensaje("Alumno guardado");
});

$("materia-form").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const id = $("materia-id").value;
    const cuerpo = {
        clave: $("materia-clave").value,
        nombre: $("materia-nombre").value,
        creditos: Number($("materia-creditos").value),
    };
    await solicitud(id ? `${api.materias}/${id}` : api.materias, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(cuerpo),
    });
    evento.target.reset();
    $("materia-id").value = "";
    await actualizarCatalogos();
    mostrarMensaje("Materia guardada");
});

$("inscripcion-form").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    await solicitud(api.inscripciones, {
        method: "POST",
        body: JSON.stringify({
            alumnoId: Number($("inscripcion-alumno").value),
            materiaId: Number($("inscripcion-materia").value),
        }),
    });
    await cargarHistorial();
    mostrarMensaje("Inscripcion registrada");
});

$("alumno-cancel").addEventListener("click", () => {
    $("alumno-form").reset();
    $("alumno-id").value = "";
});

$("materia-cancel").addEventListener("click", () => {
    $("materia-form").reset();
    $("materia-id").value = "";
});

$("load-historial").addEventListener("click", () => ejecutar(cargarHistorial));
$("load-estadisticas").addEventListener("click", () => ejecutar(cargarEstadisticas));
$("load-riesgo").addEventListener("click", () => ejecutar(cargarRiesgo));

async function ejecutar(accion) {
    try {
        await accion();
    } catch (error) {
        mostrarMensaje(error.message);
    }
}

ejecutar(async () => {
    await actualizarCatalogos();
    await cargarHistorial();
    await cargarEstadisticas();
    await cargarRiesgo();
});
