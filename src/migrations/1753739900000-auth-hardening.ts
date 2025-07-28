import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthHardening1753739900000 implements MigrationInterface {
    name = 'AuthHardening1753739900000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "token_hash" character varying NOT NULL, "device_info" jsonb, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "blacklisted_tokens" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "token_hash" character varying NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), CONSTRAINT "PK_48c4b5e5e4b8b7d4c8a5e5e4b8b" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "password_history" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "password_hash" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_48c4b5e5e4b8b7d4c8a5e5e4b8c" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "user_sessions" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_token" character varying NOT NULL, "device_info" jsonb, "ip_address" inet, "user_agent" text, "last_activity" TIMESTAMP WITH TIME ZONE NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_48c4b5e5e4b8b7d4c8a5e5e4b8d" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`ALTER TABLE users_auth ADD COLUMN failed_login_attempts integer DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE users_auth ADD COLUMN locked_until TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE users_auth ADD COLUMN last_password_change TIMESTAMP WITH TIME ZONE`);
        
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_history" ADD CONSTRAINT "FK_password_history_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_user_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_user_sessions_user_id"`);
        await queryRunner.query(`ALTER TABLE "password_history" DROP CONSTRAINT "FK_password_history_user_id"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_user_id"`);
        
        await queryRunner.query(`ALTER TABLE users_auth DROP COLUMN last_password_change`);
        await queryRunner.query(`ALTER TABLE users_auth DROP COLUMN locked_until`);
        await queryRunner.query(`ALTER TABLE users_auth DROP COLUMN failed_login_attempts`);
        
        await queryRunner.query(`DROP TABLE "user_sessions"`);
        await queryRunner.query(`DROP TABLE "password_history"`);
        await queryRunner.query(`DROP TABLE "blacklisted_tokens"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }
}
