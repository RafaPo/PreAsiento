/*
 * This file is part of FacturaScripts
 * Copyright (C) 2013-2019 Carlos Garcia Gomez <carlos@facturascripts.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 * Este fichero es parte del plugin PreAsientos de FacturaScripts 2020
 * @author Rafael del Pozo <pozo@us.es>
 * Principalmente sirve para gestionar las variables de los preasientos, ya que
 * las prepartidas se gestionan directamente por las partidas del EditAsiento.
 */

var PreVariables = []; //Éstas se cargan al comprobar las variables, entes de guardar
var NumPreVariables = 0;

/*
 * add_variable();
 * @param {string} Variable: nombre de la variable
 * @param {char} Tipo: tipo de la variable; "S" para subcuenta y "N" para numérica.
 * @returns {undefined}
 * Añade al final de la vista una fila para introducir los valores de las variables
 * (prevariables) localizadas en las partidas (prepartidas) introducidas en el preasiento.
 */
function add_variable(Variable, Tipo)
{
    var HTML = `
    <form id="formEditPreVariable` + NumPreVariables + `" method="post" enctype="multipart/form-data">
        <input type="hidden" name="action" value="edit">
        <input type="hidden" name="activetab" value="EditPreVariable">
        <input type="hidden" name="code" value="` + (NumPreVariables+1) + `">
        <input type="hidden" name="multireqtoken" value="X">
        <div class="card shadow mb-2">
            <div class="card-body">
                <div class="row">
                    <div class="col">
                        <div class="form-row ">
                            <input type="hidden" name="idpreasiento" value="X">
                            <input type="hidden" name="idprevariable" value="X">
                            <div class="col-md-1">
                                <div class="form-group">
                                    <label>Código</label>
                                    <input type="text" name="codprevariable" value="` + Variable + `" class="form-control" required="" readonly="">
                                </div>
                            </div>
                            <div class="col-md-1">
                                <div class="form-group">
                                    <label>Tipo</label>
                                    <input type="text" name="tipoprevariable" value="` + Tipo + `" class="form-control" required="" readonly="">
                                </div>
                            </div>
                            <div class="col-md">
                                <div class="form-group">
                                    <label>Mensaje</label>
                                    <input type="text" name="mensaje" value="" class="form-control" required="">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                    </div>
                    <div class="col text-right">
                    </div>
                </div>
            </div>
        </div>
    </form>`;
    $("#EditPreVariable").append(HTML);
    NumPreVariables += 1;
}

/* onVariables():
 * Se llama desde el botón "Variables", y analiza las distintas prepartidas para
 * localizar las variables.
  */
function onVariables () {
    var Cambios = false; //Si hay cambios deben comprobarse y no se permite guardar.

    //Coge los datos actuales.
    PrePartidas = getGridData();
    PreVariables = [];
    $("#EditPreVariable form").each(function(){
        Linea = $(this).serializeArray();
        var Datos = {};
        for (z=2; z<9; z++)
            Datos[Linea[z].name] = Linea[z].value;
        Datos["comprobada"] = false; //Si está comprobada (usada actualmente), no se borra
        Datos["form"] = $(this);
        PreVariables.push(Datos);
    });
    
    //Para cada partida
    for (z = 0; z < PrePartidas.length; z++)
    {
        Subcuenta = PrePartidas[z]["codsubcuenta"];
        Debe = PrePartidas[z].debe;
        Haber = PrePartidas[z].haber;
        
        //Variable en subcuenta. Sólo una por subcuenta
        var re = /[A-Z]/g;
        var Variable = "";
        var Resultado = re.exec(Subcuenta);
        if (Resultado != null) //Sólo se admite una variable por subcuenta
        {
            Variable = Resultado[0];
            //Comprobar que no está definida
            var y = 0;
            for (y = 0; y < PreVariables.length; y++)
                if (Variable == PreVariables[y]["codprevariable"])
                    break;
            if (y == PreVariables.length)
            { //Es nueva
                var Datos = {};
                Subcuenta = Subcuenta.substring(0, Resultado.index); //Sirve para la búsqueda
                Datos["code"] = NumPreVariables+1;
                Datos["codprevariable"] = Variable;
                Datos["tipoprevariable"] = "S";
                Datos["mensaje"] = "";
                Datos["comprobada"] = true;

                //Crea una nueva card para la prevariable
                add_variable(Variable, "S");
                Cambios = true;
                PreVariables.push(Datos);
            } else
                PreVariables[y]["comprobada"] = true;
        }

        //Variables de importe Debe Y Haber
        for (i = 1; i <= 2; i++)
        {
            var Importe = ((i == 1) ? Debe : Haber);
            re = /[A-Z]/g;
            Variable = "";
            Resultado = "";
            NumFin = 0;
            while ((Resultado = re.exec(Importe)) != null) //Puede haber varias, por eso el bucle
            {
                Variable = Resultado[0];
                if (Variable == 'Z') //La variable de cuadre debe ser la última
                    break;
                //Comprobar que no está definida
                var y = 0;
                for (y = 0; y < PreVariables.length; y++)
                    if (Variable == PreVariables[y].codprevariable)
                        break;
                if (y == PreVariables.length)
                { //Es nueva
                    var Datos = {};
                    Datos["code"] = NumPreVariables+1;
                    Datos["codprevariable"] = Variable;
                    Datos["tipoprevariable"] = "N";
                    Datos["mensaje"] = "";
                    Datos["comprobada"] = true;

                    //Crea una nueva card para la prevariable
                    add_variable(Variable, "N");
                    Cambios = true;
                    PreVariables.push(Datos);
                } else
                    PreVariables[y]["comprobada"] = true;
            }
        }
    }
    
    //Elimina las variables no utilizadas
    for (y = 0; y < PreVariables.length; y++)
    {
        if (PreVariables[y].comprobada == false)
        {
            PreVariables[y].form.remove();
            PreVariables.splice(y, 1);
            Cambios = true;
            y--;
        }
        else
            delete PreVariables[y].form; //Para que se puedan guardar en la base de datos sin problemas.
    }
    
    //Señala los mensajes vacíos
    M = $("#EditPreVariable form input[name='mensaje']"); //M tiene todos los mensajes
    L = M.filter(function() { return $(this).val() != ""; }); //L tiene los mensajes no vacíos
    L.removeClass("border-danger"); //Le quita el borde rojo
    V = M.filter(function() { return $(this).val() == ""; }); //V tiene los mensajes vacíos.
    if (V.length > 0) //Si hay alguno
    {
        V.addClass("border-danger"); //Le pone el borde rojo
        Cambios = true;              //Indica que no se puede guardar
    }
    
    if (Cambios)
    {
        $("#save-document").hide();
        return false;
    }
    else
    {
        $("#save-document").show();
        return true;
    }
}


/**
 * Save data to Database
 * Es la de GridView.js, pero se ejecuta esta porque el plugin es posterior.
 * Se le añaden los datos de las prevariables. Luego se pasan al controlador
 * EditPreAsiento.php, a la accion save-document.
 * @param {string} mainFormName
 * @returns {Boolean}
 */
function saveDocument(mainFormName) {
    if ( ! onVariables() ) //Más vale prevenir...
        return;
    var submitButton = document.getElementById("save-document");
    submitButton.disabled = true;
    try {
        var data = {
            action: "save-document",
            lines: getGridData("sortnum", true),
            variables: PreVariables,
            document: {}
        };
        var mainForm = $("#" + mainFormName);
        $.each(mainForm.serializeArray(), function (key, value) {
            data.document[value.name] = value.value;
        });
        $.ajax({
            type: "POST",
            url: documentUrl,
            dataType: "json",
            data: data,
            success: function (results) {
                if (results.error) {
                    alert(results.message);
                    return false;
                }
                location.assign(results.url);
            },
            error: function (xhr, status, error) {
                alert(xhr.responseText);
            }
        });
    } finally {
        submitButton.disabled = false;
        return false;
    }
}


/*
 * hideSave():
 * Si hay cualquier cambio en el grid, impide salvar hasta que se haya comprobado
 */
function hideSave(){
    $("#save-document").hide(); //Impide que se guarde el contenido hasta haber sido revisado por onVariables()
}

/*
 * $(document).ready():
 * El la funcion de jQuery que se ejecuta al terminar la carga de la página.
 */
$(document).ready(function () {
    $("#save-document").hide(); //Impide que se guarde el contenido hasta haber sido revisado por onVariables()
    if (document.getElementById("document-lines")) {
        // Añade eventos al gestor de eventos
        addEvent("afterChange", hideSave); //Si hay cambios, impide guardar.
    }
});