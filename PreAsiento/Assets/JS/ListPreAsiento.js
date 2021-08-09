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
 * Modifica LisAsiento.js para devolver los datos adecuados
 */


$(document).ready(function () {

    $("tbody tr td:nth-child(4)").each(function(){
        Code = $(this).text();
        Enlace = "EditUsePreAsiento?code=" + Code;
        $(this).html('<a href="' + Enlace + '" class="cancelClickable btn btn-success fas fa-balance-scale"></a>');
    });

});
