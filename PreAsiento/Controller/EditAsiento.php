<?php
/**
 * This file is part of FacturaScripts
 * Copyright (C) 2017-2020 Carlos Garcia Gomez <carlos@facturascripts.com>
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
 * @author Rafael del Pozo  <pozo@us.es>
 * Es una extensión al controlador EditAsiento.php original, para admitir los preasientos.
 */
namespace FacturaScripts\Plugins\PreAsiento\Controller;

use FacturaScripts\Plugins\PreAsiento\Model\PreAsiento;
use FacturaScripts\Plugins\PreAsiento\Model\PrePartida;
use FacturaScripts\Plugins\PreAsiento\Model\PreVariable;
use FacturaScripts\Core\Base\DataBase\DataBaseWhere;
use FacturaScripts\Dinamic\Lib\AssetManager;
use FacturaScripts\Core\Controller\EditAsiento as ParentController;

class EditAsiento extends ParentController {

    protected function createViews() {
        parent::createViews();
        //El .js debe cargarse después de parent::createViews();
        AssetManager::add('js', FS_ROUTE . '/Plugins/PreAsiento/Assets/JS/EditAsientoN.js');
    }

    protected function loadData($viewName, $view) {
        parent::loadData($viewName, $view);
    }

    protected function execPreviousAction($action) {
        return parent::execPreviousAction($action);
    }

    /*
     * getPreAsiento($action):
     * Devuelve los datos del preasiento solicitados por ajax en el .js.
     * Debe llamarse desde execAfterAction($action).
     * $action se puede utilizar para seleccionar qué datos se devuelven, pero no lo hacemos.
     */
    protected function getPreAsiento($action) {
        $this->setTemplate(false);
        $idPreAsiento = $this->request->get('codigo', '');
        $preAsiento = new PreAsiento(); //Es el modelo
        $where = [
            new DataBaseWhere('idPreAsiento', $idPreAsiento),
        ];

        $result = [
            'idPreAsiento' => $idPreAsiento,
            'name' => '',
            'concepto' => '',
            'prepartidas' => [],
            'variables' => []
        ];
                
        if ($preAsiento->loadFromCode('', $where)) 
        {
            $result['name']     = $preAsiento->name;
            $result['concepto'] = $preAsiento->concepto;
            $prePartida = new PrePartida(); //Model
            $count = is_null($prePartida) ? 0 : $prePartida->count($where);
            $Campos = [
                "codsubcuenta" => "", 
                "concepto"     => "",
                "debe"         => "",
                "haber"        => ""
                ];
            if ($count > 0) 
            {
                $lineas = $prePartida->all($where, [], 0, \FS_ITEM_LIMIT);
                foreach ($lineas as $linea)
                    $result['prepartidas'][] = array_intersect_key((array)$linea, $Campos);
            }
            $preVariable = new PreVariable (); //Model
            $count = is_null($preVariable) ? 0 : $preVariable->count($where);
            $Campos = [
                "codprevariable"  => "", 
                "tipoprevariable" => "",
                "mensaje"         => ""
                ];
            if ($count > 0)
            {
                $lineas = $preVariable->all($where, ['codprevariable' => 'ASC'], 0, \FS_ITEM_LIMIT);
                foreach ($lineas as $linea)
                    $result['variables'][] = array_intersect_key((array)$linea, $Campos);
            }
        }
    $this->response->setContent(json_encode($result)); //Con esto parece que se devuelve el ajax.
    }
    
    protected function execAfterAction($action) {
        switch ($action) {
            case 'get-preasiento':
                $this->getPreAsiento ($action);
                return false;
        }
        return parent::execAfterAction($action);
    }

}
