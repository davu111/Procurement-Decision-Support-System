import { useEffect, useMemo, useState } from "react";
import { productApi, type ProductLite } from "@/api/productApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductSelectorProps {
  value: string;
  onChange: (productId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  mode?: "select" | "combobox";
  label?: string;
}

export default function ProductSelector({
  value,
  onChange,
  disabled = false,
  placeholder = "Chọn mặt hàng...",
  mode = "select",
  label,
}: ProductSelectorProps) {
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    productApi
      .getAll()
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, []);

  const selectedProduct = value
    ? products.find((p) => String(p.id) === value)
    : undefined;

  function normalize(str: string) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  }

  const filteredProducts = useMemo(() => {
    if (!searchValue.trim()) return products;

    const keyword = normalize(searchValue);

    return products.filter((p) => {
      return (
        normalize(p.productName || "").includes(keyword) ||
        normalize(p.code || "").includes(keyword)
      );
    });
  }, [products, searchValue]);

  // Mode: select (đơn giản, cho các trang đơn giản)
  if (mode === "select") {
    return (
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || loading || products.length === 0}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {products.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>
              {p.code} - {p.productName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Mode: combobox (với tìm kiếm, cho NewPlanPage)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full"
          disabled={disabled}
        >
          <span className="truncate text-left">
            {selectedProduct
              ? `${selectedProduct.code} - ${selectedProduct.productName}`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Tìm mặt hàng..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>Không tìm thấy mặt hàng nào.</CommandEmpty>
          <CommandGroup className="max-h-[240px] overflow-y-auto">
            {loading ? (
              <div className="p-2 text-sm text-muted-foreground">
                Đang tải...
              </div>
            ) : (
              filteredProducts.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.code} ${product.productName}`}
                  onSelect={() => {
                    const id = String(product.id);
                    onChange(id === value ? "" : id);
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === String(product.id)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {product.code} - {product.productName}
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
