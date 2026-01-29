-- Add columns to ServiceRequest for status audit
ALTER TABLE "ServiceRequest"
ADD COLUMN "status_updated_by_user_id" INTEGER,
ADD COLUMN "status_updated_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_status_updated_by_user_id_fkey" FOREIGN KEY ("status_updated_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
