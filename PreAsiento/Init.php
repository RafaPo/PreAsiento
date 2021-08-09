<?php
namespace FacturaScripts\Plugins\PreAsiento;

use FacturaScripts\Core\Controller\AdminPlugins;
use FacturaScripts\Core\Base\InitClass;

class Init extends InitClass
{

    public function init()
    {
        //AssetManager::add('js', FS_ROUTE . '/Dinamic/Assets/JS/Print.js');
    }

    public function update()
    {
        /// código a ejecutar cada vez que se instala o actualiza el plugin
        $this->toolBox()->cache()->clear();
        //parent::exec_action('rebuild');
    }
}