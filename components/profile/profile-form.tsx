"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/lib/loading-context";

interface ProfileFormProps {
  action: (formData: FormData) => Promise<void>;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export function ProfileForm({
  action,
  username,
  displayName,
  avatarUrl,
}: ProfileFormProps) {
  const handleSubmit = useFormAction(action);

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          defaultValue={username}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={displayName}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="avatar_url">Avatar URL</Label>
        <Input
          id="avatar_url"
          name="avatar_url"
          type="url"
          placeholder="https://..."
          defaultValue={avatarUrl}
        />
      </div>
      <Button type="submit" className="w-full">
        Save Changes
      </Button>
    </form>
  );
}
