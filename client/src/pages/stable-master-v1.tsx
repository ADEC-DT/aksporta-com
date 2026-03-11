import { Fence } from "lucide-react";

export default function StableMasterV1Page() {
  return (
    <div className="flex flex-col gap-6 p-6" data-testid="page-stable-master-v1">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
          <Fence className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Stable Master V1</h1>
          <p className="text-sm text-muted-foreground">Equestrian Management — Version 1</p>
        </div>
      </div>
    </div>
  );
}
