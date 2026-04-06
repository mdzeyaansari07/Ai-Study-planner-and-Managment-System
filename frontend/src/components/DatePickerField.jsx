import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const toDateObject = (value) => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const toDisplayValue = (value) => {
  const dateValue = toDateObject(value);
  if (!dateValue) {
    return "Pick date";
  }
  return dateValue.toLocaleDateString();
};

export const DatePickerField = ({ id, label, value, onChange, required = false, testIdPrefix }) => {
  return (
    <div className="space-y-2" data-testid={`${testIdPrefix}-wrapper`}>
      <label htmlFor={id} className="text-sm font-medium" data-testid={`${testIdPrefix}-label`}>
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            className="w-full justify-between rounded-none border-2 border-[#18181b] bg-white text-[#18181b] hover:bg-[#18181b] hover:text-white"
            data-testid={`${testIdPrefix}-button`}
          >
            <span data-testid={`${testIdPrefix}-value`}>{toDisplayValue(value)}</span>
            <CalendarIcon size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto border-2 border-[#18181b] bg-white p-0" align="start" data-testid={`${testIdPrefix}-popover`}>
          <Calendar
            mode="single"
            selected={toDateObject(value)}
            onSelect={(date) => {
              if (!date) {
                if (!required) {
                  onChange("");
                }
                return;
              }
              onChange(date.toISOString().slice(0, 10));
            }}
            initialFocus
            data-testid={`${testIdPrefix}-calendar`}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
