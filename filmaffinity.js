// ==UserScript==
// @name         Lista HD en FilmAffinity
// @namespace    http://tampermonkey.net/
// @version      1.1.5
// @description  Crea un overlay estilo FilmAffinity para la lista HD
// @author       Marc
// @match        https://www.filmaffinity.com/*
// @updateURL    https://raw.githubusercontent.com/MarcRoviraP/tampermonkey_scripts/main/filmaffinity.js
// @downloadURL  https://raw.githubusercontent.com/MarcRoviraP/tampermonkey_scripts/main/filmaffinity.js
// @grant        GM_setValue
// @grant        GM_getValue

// ==/UserScript==
let listaHD = JSON.parse(GM_getValue('listaHD', '[]'));

(function () {
    'use strict';

    // Eliminar botón existente
    const delDiv = document.querySelector('.add-movie-list-info.add-to-list-button');
    if (delDiv) delDiv.remove();

    const targetDiv = document.querySelector('.add-text-content');
    if (targetDiv) {
        // Crear enlace
        const newChild = document.createElement('a');
        newChild.textContent = ' Lista HD en espera';
        newChild.style.color = '#447CAD';
        newChild.style.fontWeight = 'bold';
        newChild.style.cursor = 'pointer';
        targetDiv.appendChild(newChild);

        // Crear botón HD
        const hdButton = document.createElement('button');
        hdButton.textContent = 'HD';
        hdButton.style.cssText = `
            background: #447CAD;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            font-size: 20px;
            margin-left: 10px;
        `;
        targetDiv.appendChild(hdButton);

        // Listeners que muestran el overlay
        newChild.addEventListener('click', mostrarOverlayHD);
        hdButton.addEventListener('click', addFav);
    }
})();

// Función para guardar la lista actual
function guardarLista() {
    GM_setValue('listaHD', JSON.stringify(listaHD));
}

function addFav() {
    var nombre = document.getElementById("main-title").textContent;
    const imagen = document.querySelector('img[itemprop="image"]');
    const url = imagen.src;
    var hd = "1";

    // Generar ID único
    const id = Date.now().toString();

    listaHD.unshift({
        id: id,
        urlImg: url,
        nombre: nombre,
        estado: hd
    });
    guardarLista();
}

// ✅ Función que crea y muestra el overlay
function mostrarOverlayHD() {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    // Función para borrar película
    function borrarPeli(id) {
        listaHD = listaHD.filter(peli => peli.id !== id);
        guardarLista();
        actualizarLista();
        console.log("Borrada película con ID:", id);
    }

    // Generar lista dinámica
    function generarListaHD() {
        return listaHD.map(item => `
            <li style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee; gap: 15px;">
                <img src="${item.urlImg}" width="70" height="104" style="object-fit: cover;" />
                <span style="flex: 1; font-size: 14px; line-height: 1.4;">${item.nombre}</span>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button
                        onclick="cambiarEstado('${item.id}')"
                        style="
                            background: ${item.estado === '0' ? '#447CAD' : item.estado === '1' ? '#F9C700' : '#28a745'};
                            border: none;
                            color: white;
                            border-radius: 50%;
                            width: 35px;
                            height: 35px;
                            cursor: pointer;
                            font-size: 14px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        "
                    >
                        ${item.estado === '0' ? '⏳' : item.estado === '1' ? '🔄' : '✅'}
                    </button>
                    <button
                        onclick="borrarPeliDesdeOverlay('${item.id}')"
                        style="
                            background: #dc3545;
                            border: none;
                            color: white;
                            border-radius: 50%;
                            width: 35px;
                            height: 35px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.3s ease;
                        "
                        onmouseover="this.style.background='#c82333'"
                        onmouseout="this.style.background='#dc3545'"
                    >
                        ×
                    </button>
                </div>
            </li>
        `).join('');
    }

    // Overlay HTML
    overlay.innerHTML = `
        <div style="background: #fff; border-radius: 10px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative;">
            <div style="background: #447CAD; padding: 20px; color: white; font-size: 22px; font-weight: bold; text-align: center; position: relative;">
                LISTA <span style="color: #F9C700;">HD</span> DE ESPERA
                <div style="font-size: 14px; margin-top: 5px;">${listaHD.length} películas</div>
                <button id="closeOverlayBtn" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 20px; cursor: pointer; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">✖</button>
            </div>

            <div style="padding: 20px;">
                ${listaHD.length === 0 ?
                    '<div style="text-align: center; padding: 40px; color: #666;">No hay películas en la lista HD</div>' :
                    '<ul id="lista-hd" style="list-style: none; padding: 0; margin: 0;">' + generarListaHD() + '</ul>'
                }
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Función global para cambiar estado
    window.cambiarEstado = function(id) {
        const item = listaHD.find(peli => peli.id === id);
        if (item) {
            // Rotar entre los estados: 0 -> 1 -> 2 -> 0
            const currentEstado = parseInt(item.estado);
            item.estado = ((currentEstado + 1) % 3).toString();
            guardarLista();
            actualizarLista();
        }
    };

    // Función global para borrar película
    window.borrarPeliDesdeOverlay = function(id) {
        borrarPeli(id);
    };

    function actualizarLista() {
        const container = overlay.querySelector('div > div:last-child');

        if (listaHD.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No hay películas en la lista HD</div>';
        } else {
            container.innerHTML = '<ul id="lista-hd" style="list-style: none; padding: 0; margin: 0;">' + generarListaHD() + '</ul>';
        }
    }

    // Cerrar overlay
    overlay.querySelector('#closeOverlayBtn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}
