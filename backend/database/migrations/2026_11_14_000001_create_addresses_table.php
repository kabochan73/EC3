<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('recipient_name', 100);
            $table->string('postal_code', 8); // 123-4567
            $table->string('prefecture', 10);
            $table->string('city', 100);
            $table->string('address_line1', 255);
            $table->string('address_line2', 255)->nullable();
            $table->string('phone', 20);
            // ユーザーごと最大1件true（Actionが担保 + 下の部分UNIQUEインデックスでDBも保証）
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index('user_id');
        });

        // is_default = trueの行だけに効く部分UNIQUEインデックス（falseの行は何件あってもよい）。
        // Action側は「先に他をfalse→対象をtrue」の順に更新する（逆だと一瞬2件になり違反）
        DB::statement('CREATE UNIQUE INDEX addresses_one_default_per_user ON addresses (user_id) WHERE is_default');
    }

    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
