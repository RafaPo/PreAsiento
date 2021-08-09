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
 * Basado en el controlador de EditPreAsiento.php, para modificar y añadir preasientos.
 * Es una copia de EditAsiento.php, modificada para gestionar los preasientos.
 * Ademas de controlar el grid de las partidas, gestiona las variables. Esto se
 * debe a que sólo es posible utilizar un grid en cada controlador.
 */

namespace FacturaScripts\Plugins\PreAsiento\Controller;

use FacturaScripts\Core\Lib\ExtendedController\EditController;
use FacturaScripts\PreAsiento\Model\PreAsiento;
use FacturaScripts\PreAsiento\Model\PrePartida;
use FacturaScripts\PreAsiento\Model\PreVariable;
use FacturaScripts\Core\Base\DataBase\DataBaseWhere;
use FacturaScripts\Core\Base\DataBase;

/*
 * DeleteLinesOld():
 * No se hereda, porque el modelo es distinto (hay 3 modelos).
 * El que se le pasa aquí es el de las variables.
 */
function DeleteLinesOld($Model, &$linesOld, &$linesNew): bool {
    if (empty($linesOld)) {
        return true;
    }

    $fieldPK = $Model->primaryColumn();
    foreach ($linesOld as $lineOld) {
        $found = false;
        foreach ($linesNew as $lineNew) {
            if ($lineOld->{$fieldPK} == $lineNew[$fieldPK]) {
                $found = true;
                break;
            }
        }

        if (!$found && !$lineOld->delete()) {
            return false;
        }
    }
    return true;
}

/*
 * SaveLines():
 * Igual que antes.
 * El modelo que se le pasa aquí es el de las variables.
 */
function SaveLines($Model, $documentFieldKey, $documentFieldValue, &$data) {
    // load old data, if exits
    $field = $Model->primaryColumn();
    if (empty($data[$field])) {
        $Model->clear();
    } else {
        $Model->loadFromCode($data[$field]);
    }

    // set new data from user form
    $Model->loadFromData($data);

    // if new record, save field relation with master document
    if (empty($Model->primaryColumnValue())) {
        $Model->{$documentFieldKey} = $documentFieldValue;
    }

    return $Model->save();
}

/*
 * Esta es la clase EditPreAsiento.
 * Las funciones anteriores las he tenido que sacar de ella porque accedían a
 * variables privadas, y todavía no sabía cómo se podía acceder a ellas.
 */
class EditPreAsiento extends EditController {

    public function getModelClassName() {
        return 'PreAsiento';
    }

    public function getPageData(): array
    {
        $data = parent::getPageData();
        $pageData['menu'] = 'accounting';
        $pageData['title'] = 'PreAsiento';
        $pageData['icon'] = 'fas fa-cogs';
        return $data;
    }
    
    protected function createViews() 
    {
        //Aquí se crea el grid para las partidas
        $master = ['name' => 'EditPreAsiento', 'model' => 'PreAsiento'];
        $detail = ['name' => 'EditPrePartida', 'model' => 'PrePartida'];
        $this->addGridView($master, $detail, 'PreAsiento', 'fas fa-cogs');
        $this->views['EditPreAsiento']->template = 'EditPreAsiento.html.twig';
        //$this->setSettings('EditPreAsiento', 'btnSave', false);
        $this->setTabsPosition('bottom');

        // Lo lógico sería añadir aquí un grid para las variables, pero no se puede.
        // Se copia el sistema de añadir las cuentas bancarias de los clientes.
        $this->addEditListView('EditPreVariable', 'PreVariable', 'prevariables', 'fa-road');
        $this->setSettings('EditPreVariable', 'btnNew', false);
        $this->setSettings('EditPreVariable', 'btnDelete', false);
        $this->setSettings('EditPreVariable', 'btnUndo', false);
        $this->setSettings('EditPreVariable', 'btnSave', false);
    }

    protected function loadData($viewName, $view) 
    {
        switch ($viewName) {
            case 'EditPreVariable':
                //Carga los datos de las prevariables
                $idPreAsiento = $this->getViewModelValue('EditPreAsiento', 'idpreasiento');
                $where = [new DataBaseWhere('idpreasiento', $idPreAsiento)];
                $view->loadData('', $where);
                break;

            // parent::loadData carga el preasiento y las partidas, al igual que el aseinto y sus partidas.
            default:
                parent::loadData($viewName, $view);
                if (!$this->views[$this->active]->model->exists()) {
                $this->views[$this->active]->model->user = $this->user->nick;
                }
                break;
        }
    }
    
    protected function execAfterAction($action) {
        switch ($action) {
            case 'save-ok':
                ; //Poner aquí lo que sea
                break;
        }
        parent::execAfterAction($action);
    }

    protected function execPreviousAction($action) {
        switch ($action) {
            case 'save-document':
                //Al crear un nuevo preasiento la $action es insert. Sólo llega hasta aquí si hay ya un code del preasiento.
                //Ésta es la action save-document de PanelController.php
                $viewName = "EditPreAsiento";
                $this->setTemplate(false);
                $data = $this->request->request->all();
                $result = $this->views[$viewName]->saveData($data);
                $this->response->setContent(json_encode($result, JSON_FORCE_OBJECT));
                //Salvar aquí las variables
                $R = substr($result['url'], strpos($result['url'], "?")+1 );
                parse_str($R,$R);
                if ($R['action'] == 'save-ok' && is_numeric($R['code']) &&  isset($data['variables']) && count($data['variables']) > 0)
                {
                    $idPreAsiento = intval($R['code']);
                    // load detail document data (old)
                    $Model = $this->views['EditPreVariable']->model;
                    $linesOld = $Model->all([new DataBaseWhere('idpreasiento', $idPreAsiento)]);
                    $Lineas = array();
                    foreach ($data['variables'] as $Linea)
                    {
                        $Nueva = array();
                        $Nueva['idpreasiento'] = $idPreAsiento;
                        $Nueva['idprevariable'] = $Linea['idprevariable'];
                        $Nueva['codprevariable'] = $Linea['codprevariable'];
                        $Nueva['tipoprevariable'] = $Linea['tipoprevariable'];
                        $Nueva['mensaje'] = $Linea['mensaje'];
                        $Lineas[] = $Nueva;
                    }
                    
                    // start transaction
                    $dataBase = new DataBase();
                    $dataBase->beginTransaction();

                    // delete old lines not used. De las variables, porque es su modelo
                    DeleteLinesOld($Model,$linesOld, $Lineas);
                    if (!DeleteLinesOld($Model,$linesOld, $Lineas)) {
                        throw new Exception($this->toolBox()->i18n()->trans('error-deleting-lines'));
                    }

                    // Proccess detail document data (new)
                    // Master Model must implement GridModelInterface
                    foreach ($Lineas as $newLine) {
                        if (!SaveLines($Model, 'idpreasiento', $idPreAsiento, $newLine)) {
                            throw new Exception($this->toolBox()->i18n()->trans('error-saving-lines'));
                        }
                    }

                    // confirm save data into database
                    $dataBase->commit();
                }
                break;
                
            default:
                return parent::execPreviousAction($action);
        }
    }

}