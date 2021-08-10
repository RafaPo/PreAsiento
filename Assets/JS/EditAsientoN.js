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
 * Cambia el nombre aEditAsientoN.js para no sustituir al original. Debe ser
 * cargado manualmente.
 */

var VariablesModal, //Guarda el div modal para solicitar las variables
    VariablesBody,  //Guarda el body del div modal, donde se inertarán las variables
    Results;        //Datos devueltos al solicitar el preasiento. Se utilizan también para guardar los valores.

/*
 * AñadeVAriable():
 * Añade el HTML necesario al div modal para solicitar una variable del preasiento
 * Código:    Código de la variable (de 'A' a 'Z').
 * Tipo:      Tipo de la variable: 'S', subcuenta; 'N', numérica.
 * Mensaje:   Mensaje con el que se solicitará al usuario el valor de la variable
 * Subcuenta: Si la variable es de tipo subcuenta, se incluyen aquí los primeros dígitos de la misma,
 *              sacados de la primera partida en la que aparece.
 * A cada input de variable se le añade un identificador: Variable_Código (ej: Variable_A)
 */
function AñadeVariable (Codigo, Tipo, Mensaje, Subcuenta="") {
    
    //Código de la variable a preguntar, no se puede cambiar
    HTML = (`
<div class="row" id="row` + Codigo + `">
    <div class="col-md-1">
        <div class="form-group">
            <input type="text" name="` + Codigo + `" value="` + Codigo + `" class="form-control" readonly="">
        </div>
    </div>`);
    
    /*  Si es de tipo subcuenta se pone un widget autocompletar, que mostrará al usuario sólo las subcuentas
     *  que comienzan por "Subcuenta".
     */
    if (Tipo == 'S')
        HTML += (`
    <div class="col-md-3">
        <div class="form-group">
            <div class="input-group">
                <div class="input-group-prepend">
                    <span class="input-group-text">
                        <i class="fas fa-search fa-fw"></i>
                    </span>
                </div>
                <input type="text" value="` + Subcuenta + `" class="form-control widget-autocomplete 
                        ui-autocomplete-input" id="Variable_` + Codigo + `"
                       data-field="codsubcuenta" data-source="subcuentas" data-fieldcode="descripcion" 
                       data-fieldtitle="codsubcuenta" data-fieldfilter="" data-strict="1" autocomplete="off">
                <style>
                    #ui-id-3 {
                        z-index: 10000;
                    }
                </style>
            </div>
        </div>
    </div>`);
    else
        // Si no es subcuenta, es de tipo numérico, y se añade un widget de texto normal.
        HTML += (`
    <div class="col-md-3">
        <div class="form-group">
            <input type="text" name="cantidad" id = "Variable_` + Codigo + `" value="" class="form-control">
        </div>
    </div>`);
    
    //Mensaje con el que se solicita al usuario la variable. No se puede cambiar.
    HTML += (`
    <div class="col-md-8">
        <div class="form-group">
            <input type="text" name="mensaje" value="` + Mensaje + `" class="form-control" readonly="">
        </div>
    </div>
</div>`);

    VariablesBody.append(HTML); //Añade al final del div modal el HTML para solicitar la variable

    //Si la variable es de tipo subcuenta hay que añadirle el evento de autocompletar
    if (Tipo == 'S')
    {
        VariableSelect = VariablesBody.find("#Variable_" + Codigo);
        VariableSelect.focus(function () {
            Texto = $(this).val();
            $(this).autocomplete("search", Texto + '%'); 
            /* El % final hace que sólo se busquen lassubcuentas que comienzan por el mismo
             * código que la subcuenta original. Así no aparecen subcuentas de otras cuentas.
             */
        });

        //Le añade el autocomplete. Es el mismo del EditAsiento.js original, pero sólo para este input.
        var data = {
            field: VariableSelect.attr("data-field"),
            fieldcode: VariableSelect.attr("data-fieldcode"),
            fieldfilter: VariableSelect.attr("data-fieldfilter"),
            fieldtitle: VariableSelect.attr("data-fieldtitle"),
            source: VariableSelect.attr("data-source"),
            strict: VariableSelect.attr("data-strict")
        };
        var formId = VariableSelect.closest("form").attr("id");
        VariableSelect.autocomplete({
            source: function (request, response) {
                $.ajax({
                    method: "POST",
                    url: window.location.href,
                    data: widgetAutocompleteGetData(formId, data, request.term),
                    dataType: "json",
                    success: function (results) {
                        var values = [];
                        results.forEach(function (element) {
                            if (element.key === null || element.key === element.value) {
                                values.push(element);
                            } else {
                                values.push({key: element.key, value: element.key + " | " + element.value});
                            }
                        });
                        response(values);
                    },
                    error: function (msg) {
                        alert(msg.status + " " + msg.responseText);
                    }
                });
            },
            select: function (event, ui) {
                if (ui.item.key !== null) {
                    $("form[id=" + formId + "] input[name=" + data.field + "]").val(ui.item.key);
                    var value = ui.item.value.split(" | ");
                    if (value.length > 1) {
                        ui.item.value = value[1];
                    } else {
                        ui.item.value = value[0];
                    }
                }
            }
        });
    }
}

/*
 * CalculaPartidas ():
 * Se ejecuta tras ValoraVariables(). Ya se han pedido todos los valores de las
 * variables al usuario, pero queda sacar para las variables de subcuenta el
 * código propio de la variable, sin los datos de la cuenta original, para que
 * se pueda utilizar para seleccionar subcuentas de otras cuentas.
 */
function CalculaPartidas () {
    VariablesModal.modal("hide");
    
    //Termina la valoración de las variables
    for (z=0; z<Results['variables'].length; z++)
    {
        Valor = VariablesBody.find ("#Variable_"+Results['variables'][z]['codprevariable']).val();
        if (Results['variables'][z]['tipoprevariable'] == 'S')
            Valor = Valor.substring(Results['variables'][z]['subcuenta'].length);
        else
            Valor = parseFloat(Valor);
        Results['variables'][z]['valor'] = Valor;
    }
    
    //Hace los cálculos de las partidas
    TotalDebe = 0;
    TotalHaber = 0;
    for (z=0; z<Results['prepartidas'].length; z++)
    {
        var num = 0;
        var Descripcion;
        var Saldo;

        /* Valor de la subcuenta. Si tiene alguna variable se pone el código de
         * la cuenta original y se añade el de la variable. Sólo puede haber
         * una variable de subcuenta en cada subcuenta.
         */
        var Subcuenta = Results['prepartidas'][z]['codsubcuenta'];
        var re = /[A-Z]/g;
        var Variable = "";
        var Resultado = re.exec(Subcuenta);
        if ( Resultado != null )
        {
            Variable = Resultado[0];
            //show_buscar_subcuentas(0, 'subcuenta', Subcuenta.substring(0,re.lastIndex-1) );
            Subcuenta = Subcuenta.substring(0,Resultado.index);
        }
        for (y=0; y<Results['variables'].length; y++)
            if (Variable == Results['variables'][y]['codprevariable'])
            {
                Subcuenta += Results['variables'][y]['valor'];
                break;
            }
        
        //Concepto de la partida. En el grid se titula Descripción.
        Descripcion = Results['prepartidas'][z]['concepto']; 
        
        //Si está vacío se usa el concepto del asiento
        //if (Descripcion === null)
        //    Descripcion = $('input[name="concepto"]').val();

        //Debe Y HABER
        var Debe = 0;
        var Haber = 0;
        Z = 0; //Z es la variable de cuadre. Si aparece se acaba el preasiento.
        
        //Es el mismo cálculo para el debe y el haber, por lo que se usa un bucle.
        Valores = [0, Results['prepartidas'][z]['debe'], Results['prepartidas'][z]['haber'] ];
        for (i=1; i<=2; i++)
        {
            var Importe  = Valores[i];
            re = /[A-Z]/g;
            Variable = "";
            Resultado = "";
            Final = "";
            NumFin = 0;
            while ( (Resultado = re.exec(Importe)) != null )
            {
                Variable = Resultado[0];
                if (Variable == 'Z')
                {
                    Z = i; //Z debe estar sólo y al final. Z indica si está en Debe o Haber
                    break;
                }
                Final += Importe.substring(NumFin, Resultado.index);
                NumFin = Resultado.index+1;
                for (y=0; y<Results['variables'].length; y++)
                    if (Variable == Results['variables'][y]['codprevariable'])
                    {
                        Final += Results['variables'][y]['valor']; 
                        break;
                    }
            }
            if (Final == "")
                Final = Importe;
            else
                Final += Importe.substring(NumFin,Importe.length);
            if (i==1)
                Debe = Final;
            else
                Haber = Final;
        }
        
        //Ya se ha calculado el debe y el haber de la partida. Se añaden al total del asiento.
        //Si ha aprecido la variable Z no se añade el debe o el haber correspondiente.
        if (Z!=1)
        {
            Debe = eval(Debe);
            TotalDebe += Debe;
        }
        if (Z!=2)
        {
            Haber = eval(Haber);
            TotalHaber += Haber;
        }
        
        //Si ha aparecido la variable Z se calcula el debe o el haber de la última partida.
        if (Z==1)
            Debe = TotalHaber - TotalDebe;
        if (Z==2)
            Haber = TotalDebe - TotalHaber;
        
        //Mete los valores en el grid.
        var values = [
            { "field": "codsubcuenta", "value": Subcuenta },
            { "field": "concepto", "value": Descripcion },
            { "field": "debe", "value": Debe },
            { "field": "haber", "value": Haber }
        ];
        setGridRowValues(z, values);

        if (Z>0 && z<Results['prepartidas'].length-1)
        {
            alert ("Se ha encontrado la variable Z antes del final del asiento.");
            break;
        }
    }
}

/*
 *  ValoraVariables():
 *  Se ejecuta tras haber obtenido los datos del preasiento. 
 *  Los datos están en la variable global Results.
 *  Añade cada variable a solicitar al usuario al div modal.
 */
function ValoraVariables () {
    //VariablesModal. Si no existe, se inicializa ahora (el div ya está en el HTML por el XMLView).
    if (VariablesModal === undefined) 
    {
        VariablesModal = $("#modalVariables");
        VariablesBody = VariablesModal.find(".modal-body");
        VariablesFooter = VariablesModal.find(".modal-footer");
        VariablesSubmit = VariablesFooter.find("button[value=\"Variables\"]");
        VariablesSubmit.prop("type", "button");
        VariablesSubmit.attr("onclick", "CalculaPartidas()");
        VariablesBody.html(""); //Elimina las variables de ejemplo
    }
    
    //Variables
    for (z=0; z<Results['variables'].length; z++)
    {
        Variable = Results['variables'][z]['codprevariable'];
        Subcuenta = "";
        Mensaje = Results['variables'][z]['mensaje'];
        Tipo = Results['variables'][z]['tipoprevariable'];
        if (Tipo == 'S') //Coge los primeros dígitos de la cuenta en la que aparece por primera vez.
        {
            for (y=0; y<Results['prepartidas'].length; y++)
                if ( (p = Results['prepartidas'][y]['codsubcuenta'].indexOf(Variable)) >= 0 )
                {
                    Subcuenta = Results['prepartidas'][y]['codsubcuenta'].substring(0,p);
                    break;
                }
            if ( y == Results['prepartidas'].length)
            {
                alert ("No se ha encontrado uso para la variable " + Variable);
                return;
            }
            Results['variables'][z]['subcuenta'] = Subcuenta;
        }
        AñadeVariable (Variable, Tipo, Mensaje, Subcuenta); //Añade la variable al div modal.
    }
    if (z>0) //Hay variables
        VariablesModal.modal("show");
    else
        CalculaPartidas(Results); //Si no hay variables, se calculan las partidas directamente (preasiento fijo).
}

/*
 *  CreaAsiento():
 *  Se llama al seleccionar un preasiento para su creación. Sólo puede ocurrir cuando en la
 *  vista de asientos no se ha creado todavía el asiento. Simplemente toma el concepto del preasiento,
 *  lo pone en el asiento y lo graba.
 *  El campo idPreAsiento queda grabado porque en la extensión de la vista EditAsiento.xml al 
 *  select del idPreAsiento se le asignó el campo idpreasiento.
*/
function CreaAsiento () {
    $('input[name="concepto"]').val(Results["concepto"]);
    $('#formEditAsiento').submit(); //¡Ojo con los botones! Cambian los identificadores.
}

/*
 *  $(document).ready():
 *  Función de jQuery que se ejecuta cuando se ha terminado de cargar la página.
 *  ¡Ojo! Los ficheros .js que no tengan el mismo nombre que la vista, como éste,
 *      para no modificar el original, deben cargarse en el controlador .php
 *      en la función createViews DESPUÉS de haberse llamado a parent::createViews().
 *      En otro caso se ejecuta antes de que se haya cargado el grid.
 */
$(document).ready(function () {

    idPreAsiento = $('select[name="idpreasiento"]').val(); //Sólo está puesto si se creó el asiento con un preasiento.
    NumAsiento = $("h1 .text-info").text();
    Results = [];
    if (isNaN(NumAsiento))  //Todavía no se ha creado el asiento -> Es posible seleccionar el preasiento
    {
        // Le asigna al select de preasientos la función que se encargará de guardar el asiento 
        // con el concepto principal, cuando se seleccione.
        $('select[name="idpreasiento"]').change(function () {
            idPreAsiento = $(this).val();
            if (idPreAsiento == "")
                return;
             var data = {
                action: "get-preasiento",
                codigo: idPreAsiento
            };
            $.ajax({
                type: "POST",
                url: documentUrl,
                dataType: "json",
                data: data,
                success: function (results) {
                    Results = results;
                    CreaAsiento();
                },
                error: function (xhr, status, error) {
                    alert(xhr.responseText);
                }
            });
        });
    }
    else if ( ! isNaN(idPreAsiento) ) //El asiento está creado y usa un asiento predefinido al inicio de la carga
    {
        if (getGridFieldData(0, "idpartida") === undefined) //No hay partidas. El asiento se acaba de crear
        {
            //Coge los datos del preasiento
            var data = {
                action: "get-preasiento",
                codigo: idPreAsiento
            };
            $.ajax({
                type: "POST",
                url: documentUrl,
                dataType: "json",
                data: data,
                success: function (results) {
                    Results = results;
                    ValoraVariables();
                },
                error: function (xhr, status, error) {
                    alert(xhr.responseText);
                }
            });
        }
    }

});