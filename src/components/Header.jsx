function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <h1 className="text-2xl font-semibold text-gray-800">
        FIT File Data Exporter
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Import Garmin FIT files and export selected data to CSV
      </p>
    </header>
  );
}

export default Header;
