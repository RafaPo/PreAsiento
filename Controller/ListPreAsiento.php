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
 * Basado en el controlador de ListAsiento.php, modificado para listar preasientos.
 */

namespace FacturaScripts\Plugins\PreAsiento\Controller;

use FacturaScripts\Core\Lib\ExtendedController\ListController;

class ListPreAsiento extends ListController
{
    public function getPageData()
    {
        $pageData = parent::getPageData();
        $pageData['menu'] = 'accounting';
        $pageData['title'] = 'PreAsientos';
        $pageData['icon'] = 'fas fa-cogs';

        return $pageData;
    }

    protected function createViews()
    {
        $this->createViewPreAsiento();
    }
    protected function createViewPreAsiento($viewName = 'ListPreAsiento')
    {
        $this->addView($viewName, 'PreAsiento');
        $this->addSearchFields($viewName, ['name','concepto']);
        $this->addOrderBy($viewName, ['name'], 'name', 1);
    }
}