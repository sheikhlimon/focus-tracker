-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "auto_populate" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "duration_min" INTEGER NOT NULL DEFAULT 25,
ADD COLUMN     "session" TEXT NOT NULL DEFAULT 'day',
ADD COLUMN     "url" TEXT;

-- CreateTable
CREATE TABLE "task_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "duration_min" INTEGER NOT NULL,
    "session" TEXT NOT NULL DEFAULT 'day',
    "position" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
