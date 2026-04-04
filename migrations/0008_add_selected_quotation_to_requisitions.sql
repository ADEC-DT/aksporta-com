ALTER TABLE "requisitions" ADD COLUMN "selected_quotation_id" varchar;
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_selected_quotation_id_requisition_quotations_id_fk" FOREIGN KEY ("selected_quotation_id") REFERENCES "requisition_quotations"("id") ON DELETE SET NULL;
