// ==UserScript==
// @name         Lista HD en FilmAffinity
// @namespace    http://tampermonkey.net/
// @version      1.1.1
// @description  Crea un overlay estilo FilmAffinity para la lista HD
// @author       Marc
// @match        https://www.filmaffinity.com/*
// @updateURL    https://raw.githubusercontent.com/MarcRoviraP/tampermonkey_scripts/main/filmaffinity.js
// @downloadURL  https://raw.githubusercontent.com/MarcRoviraP/tampermonkey_scripts/main/filmaffinity.js
// @grant        GM_setValue
// @grant        GM_getValue

// ==/UserScript==
let listaHD = JSON.parse(GM_getValue('listaHD', '[]'));
let a = 5;
(function () {
    'use strict';

    // Recuperar lista HD

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
function addFav(){


    var nombre = document.getElementById("main-title").textContent
    const imagen = document.querySelector('img[itemprop="image"]');
    const url = imagen.src;
    var hd = "1"
    listaHD.unshift({
        id:"1",
        urlImg: url,
        nombre: nombre,
        estado: hd})
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

    // Generar lista dinámica
    function generarListaHD() {
        return listaHD.map(item => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee;">
<img src="${item.urlImg}" width="70" height="104" />
            <span style="flex: 1;">${item.nombre}</span>
            <button
                onclick="cambiarEstado(${item.id})"
                style="
                    background: ${item.estado === '0' ? '#447CAD' : item.estado === '1' ? '#F9C700' : '#28a745'};
                    border: none;
                    color: white;
                    border-radius: 50%;
                    width: 35px;
                    height: 35px;
                    cursor: pointer;
                    font-size: 14px;
                "
            >
                ${item.estado === '0' ? '⏳' : item.estado === '1' ? '🔄' : '✅'}
            </button>
        </li>
    `).join('');
    }

    // Overlay HTML
    overlay.innerHTML = `
    <div style="background: #fff; border-radius: 10px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative;">
        <div style="background: #447CAD; padding: 20px; color: white; font-size: 22px; font-weight: bold; text-align: center;">
            LISTA <span style="color: #F9C700;">HD</span> DE ESPERA
            <div style="font-size: 14px; margin-top: 5px;">${listaHD.length} películas</div>
        </div>

        <button id="closeOverlayBtn" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 20px; cursor: pointer; border-radius: 50%; width: 30px; height: 30px;">✖</button>

        <div style="padding: 20px;">
            <ul id="lista-hd" style="list-style: none; padding: 0; margin: 0;">
                ${generarListaHD()}
            </ul>
        </div>
    </div>
`;

    document.body.appendChild(overlay);

    // Función global para cambiar estado
    window.cambiarEstado = function(id) {
        const item = listaHD.find(peli => peli.id === id);
        if (item) {
            const estados = ['pendiente', 'procesando', 'completado'];
            const currentIndex = estados.indexOf(item.estado);
            item.estado = estados[(currentIndex + 1) % estados.length];
            actualizarLista();
        }
    };

    function actualizarLista() {
        const listaElement = overlay.querySelector('#lista-hd');
        listaElement.innerHTML = generarListaHD();
    }

    // Cerrar overlay
    overlay.querySelector('#closeOverlayBtn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}
