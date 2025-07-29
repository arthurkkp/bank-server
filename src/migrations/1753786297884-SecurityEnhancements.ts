import {MigrationInterface, QueryRunner} from "typeorm";

export class SecurityEnhancements1753786297884 implements MigrationInterface {
    name = 'SecurityEnhancements1753786297884'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "device_fingerprint" character varying, "ip_address" character varying, "user_agent" text, "is_revoked" boolean NOT NULL DEFAULT false, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "UQ_refresh_token" UNIQUE ("token"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);

        await queryRunner.query(`CREATE TABLE "password_history" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "password_hash" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_password_history" PRIMARY KEY ("id"))`);

        await queryRunner.query(`CREATE TABLE "user_two_factor" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "secret" character varying NOT NULL, "is_enabled" boolean NOT NULL DEFAULT false, "backup_codes" text, "recovery_codes_used" integer NOT NULL DEFAULT 0, "last_used_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "REL_user_two_factor_user" UNIQUE ("user_id"), CONSTRAINT "PK_user_two_factor" PRIMARY KEY ("id"))`);

        await queryRunner.query(`CREATE TABLE "device_sessions" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "device_fingerprint" character varying NOT NULL, "device_name" character varying, "ip_address" character varying, "user_agent" text, "last_activity" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_device_sessions" PRIMARY KEY ("id"))`);

        await queryRunner.query(`CREATE TABLE "account_lockouts" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "failed_attempts" integer NOT NULL DEFAULT 0, "locked_until" TIMESTAMP WITH TIME ZONE, "last_failed_attempt" TIMESTAMP WITH TIME ZONE, "ip_address" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "REL_account_lockouts_user" UNIQUE ("user_id"), CONSTRAINT "PK_account_lockouts" PRIMARY KEY ("id"))`);

        await queryRunner.query(`CREATE TYPE "security_audit_logs_event_type_enum" AS ENUM('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGED', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'TOKEN_REFRESHED', 'SUSPICIOUS_ACTIVITY')`);
        await queryRunner.query(`CREATE TABLE "security_audit_logs" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_type" "security_audit_logs_event_type_enum" NOT NULL, "description" text, "ip_address" character varying, "user_agent" text, "metadata" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_security_audit_logs" PRIMARY KEY ("id"))`);

        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_history" ADD CONSTRAINT "FK_password_history_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_two_factor" ADD CONSTRAINT "FK_user_two_factor_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "device_sessions" ADD CONSTRAINT "FK_device_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account_lockouts" ADD CONSTRAINT "FK_account_lockouts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "security_audit_logs" ADD CONSTRAINT "FK_security_audit_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_password_history_user_id" ON "password_history" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_device_sessions_user_id" ON "device_sessions" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_device_sessions_fingerprint" ON "device_sessions" ("device_fingerprint")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_audit_logs_user_id" ON "security_audit_logs" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_audit_logs_event_type" ON "security_audit_logs" ("event_type")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_audit_logs_created_at" ON "security_audit_logs" ("created_at")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_security_audit_logs_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_security_audit_logs_event_type"`);
        await queryRunner.query(`DROP INDEX "IDX_security_audit_logs_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_device_sessions_fingerprint"`);
        await queryRunner.query(`DROP INDEX "IDX_device_sessions_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_password_history_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_expires_at"`);
        await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_user_id"`);

        await queryRunner.query(`ALTER TABLE "security_audit_logs" DROP CONSTRAINT "FK_security_audit_logs_user"`);
        await queryRunner.query(`ALTER TABLE "account_lockouts" DROP CONSTRAINT "FK_account_lockouts_user"`);
        await queryRunner.query(`ALTER TABLE "device_sessions" DROP CONSTRAINT "FK_device_sessions_user"`);
        await queryRunner.query(`ALTER TABLE "user_two_factor" DROP CONSTRAINT "FK_user_two_factor_user"`);
        await queryRunner.query(`ALTER TABLE "password_history" DROP CONSTRAINT "FK_password_history_user"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_user"`);

        await queryRunner.query(`DROP TABLE "security_audit_logs"`);
        await queryRunner.query(`DROP TYPE "security_audit_logs_event_type_enum"`);
        await queryRunner.query(`DROP TABLE "account_lockouts"`);
        await queryRunner.query(`DROP TABLE "device_sessions"`);
        await queryRunner.query(`DROP TABLE "user_two_factor"`);
        await queryRunner.query(`DROP TABLE "password_history"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }
}
