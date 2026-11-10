<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class InitialMigrationRecoveryTest extends TestCase
{
    public function test_partial_initial_migration_preserves_existing_users(): void
    {
        $migration = require database_path('migrations/0001_01_01_000000_create_users_table.php');
        $migration->up();
        DB::table('users')->insert(['name' => 'Existing customer', 'email' => 'customer@example.test', 'password' => 'existing-hash']);
        Schema::drop('sessions');
        Schema::drop('password_reset_tokens');

        $migration->up();

        $this->assertSame('Existing customer', DB::table('users')->value('name'));
        $this->assertTrue(Schema::hasTable('password_reset_tokens'));
        $this->assertTrue(Schema::hasTable('sessions'));
        $migration->down();
    }

    public function test_mysql_connections_explicitly_use_innodb(): void
    {
        $this->assertSame('InnoDB', config('database.connections.mysql.engine'));
        $this->assertSame('InnoDB', config('database.connections.mariadb.engine'));
    }
}
