import { ComponentProps } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useMail } from "@/components/mail/use-mail";
import { Mail } from "@/components/mail/data";
import { Badge } from "@/components/ui/badge";
import { BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

import { formatDate } from "@/utils/format-date";
import { useThread } from "@/hooks/use-threads";
import { tagsAtom, Tag } from "./use-tags";
import { Skeleton } from "../ui/skeleton";
import { useAtomValue } from "jotai";

interface MailListProps {
  items: Mail[];
  isCompact: boolean;
  onMailClick: () => void;
}

const Thread = ({ id }: { id: string }) => {
  const [mail, setMail] = useMail();
  const { data } = useThread(id);
  return data ? <p>Test</p> : <Skeleton />;
};

export function MailList({ items, isCompact, onMailClick }: MailListProps) {
  const [mail, setMail] = useMail();

  const tags = useAtomValue(tagsAtom);
  const activeTags = tags.filter((tag) => tag.checked);

  const handleMailClick = (selectedMail: Mail) => {
    if (mail.selected === selectedMail.id) {
      setMail({
        selected: null,
      });
    } else {
      setMail({
        ...mail,
        selected: selectedMail.id,
      });
    }

    onMailClick();
  };

  return (
    <ScrollArea className="" type="auto">
      <div className="flex flex-col pt-0">
        {items.map((item) => (
          <Thread key={item.id} id={item.id} />
        ))}
      </div>
    </ScrollArea>
  );
}

// things were turning into a ?:?:?: fest had to dip out
const MailBadge = ({ label, isActive }: { label: string; isActive?: boolean }) => {
  return <Badge variant={isActive ? "default" : getDefaultBadgeStyle(label)}>{label}</Badge>;
};

function MailLabels({
  labels,
  activeTags,
  isCompact,
  isSelected,
}: {
  labels: string[];
  activeTags: Tag[];
  isCompact: boolean;
  isSelected: boolean;
}) {
  if (!labels.length) return null;

  const activeLabels = labels.filter((label) =>
    activeTags.some((tag) => tag.label.toLowerCase() === label.toLowerCase()),
  );

  return (
    <div
      className={cn("flex select-none items-center gap-2", isCompact && !isSelected && "hidden")}
    >
      {activeTags.length > 0
        ? activeLabels.map((label) => <MailBadge key={label} label={label} isActive />)
        : labels.map((label) => <MailBadge key={label} label={label} />)}
    </div>
  );
}

function getDefaultBadgeStyle(label: string): ComponentProps<typeof Badge>["variant"] {
  switch (label.toLowerCase()) {
    case "work":
      return "default";
    case "personal":
      return "outline";
    default:
      return "secondary";
  }
}
