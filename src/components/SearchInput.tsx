import { SearchIcon } from "./ui/icons";

type SearchInputProps = {
  id: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export function SearchInput({
  id,
  value,
  placeholder = "Search snippets",
  onChange,
}: SearchInputProps) {
  return (
    <div className="search-wrapper">
      <label htmlFor={id} className="visually-hidden">
        Search snippets
      </label>
      <span className="search-wrapper__icon" aria-hidden="true">
        <SearchIcon size={14} />
      </span>
      <input
        id={id}
        className="search-field"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}
