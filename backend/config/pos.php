<?php

return [

    /*
    |--------------------------------------------------------------------------
    | BiziSmart POS catalogue import
    |--------------------------------------------------------------------------
    |
    | Settings for the pos:products:import command. The POS database itself is
    | read through the "pos" connection in config/database.php, which is
    | configured with the POS_DB_* environment variables.
    |
    */

    'image_source' => env('POS_IMAGE_SOURCE'),

];
