#!/usr/bin/env python3

import tempfile
import unittest
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

from xlsx_parser import parse_workbook


class XlsxParserTest(unittest.TestCase):
    def test_parses_required_metrics_and_period(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "AggregateAnalytics_2026-07-22_2026-07-28.xlsx"
            self._write_fixture(path)
            result = parse_workbook(path)
            self.assertEqual(result["period"], {"start": "2026-07-22", "end": "2026-07-28"})
            self.assertEqual(result["metrics"], {
                "impressions": 805,
                "membersReached": 438,
                "engagements": 29,
                "followers": 28,
            })

    def test_fails_closed_when_required_sheet_is_missing(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "bad.xlsx"
            self._write_fixture(path, include_followers=False)
            with self.assertRaisesRegex(ValueError, "missing required sheets"):
                parse_workbook(path)

    def _write_fixture(self, path: Path, include_followers: bool = True):
        sheets = [
            ("DISCOVERY", [["Impressions", 805], ["Members reached", 438]]),
            ("ENGAGEMENT", [["Engagements", 29]]),
        ]
        if include_followers:
            sheets.append(("FOLLOWERS", [["Total followers", 28]]))

        workbook_sheets = []
        rels = []
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
            for index, (name, rows) in enumerate(sheets, start=1):
                workbook_sheets.append(f'<sheet name="{escape(name)}" sheetId="{index}" r:id="rId{index}"/>')
                rels.append(f'<Relationship Id="rId{index}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{index}.xml"/>')
                archive.writestr(f"xl/worksheets/sheet{index}.xml", self._sheet_xml(rows))

            archive.writestr("xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + "".join(workbook_sheets) + "</sheets></workbook>")
            archive.writestr("xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + "".join(rels) + "</Relationships>")

    @staticmethod
    def _sheet_xml(rows):
        row_xml = []
        for row_number, row in enumerate(rows, start=1):
            cells = []
            for column_number, value in enumerate(row, start=1):
                column = chr(64 + column_number)
                if isinstance(value, str):
                    cells.append(f'<c r="{column}{row_number}" t="inlineStr"><is><t>{escape(value)}</t></is></c>')
                else:
                    cells.append(f'<c r="{column}{row_number}"><v>{value}</v></c>')
            row_xml.append(f'<row r="{row_number}">' + "".join(cells) + "</row>")
        return '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + "".join(row_xml) + "</sheetData></worksheet>"


if __name__ == "__main__":
    unittest.main()
