-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "actor_user_id" INTEGER NOT NULL,
    "action_type" TEXT NOT NULL,
    "target_user_id" INTEGER,
    "metadata" JSONB NOT NULL,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_action_type_idx" ON "audit_logs"("action_type");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
