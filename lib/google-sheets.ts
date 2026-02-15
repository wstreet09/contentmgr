import { google } from "googleapis"
import { getVideoAuthenticatedClient } from "@/lib/google-drive"

const TRACKING_COLUMNS = [
  "Video Topics - Strategist",
  "Hooks - Strategist",
  "Video Link - AM",
  "Thumbnails - AM",
  "Descriptions - Strategist",
  "Mini-blog - Strategist",
  "Live Link - Social",
]

export async function createTrackingSheet(
  videoProjectId: string,
  projectName: string,
  folderId: string
) {
  const authClient = await getVideoAuthenticatedClient(videoProjectId)
  const drive = google.drive({ version: "v3", auth: authClient })
  const sheets = google.sheets({ version: "v4", auth: authClient })

  const year = new Date().getFullYear()
  const sheetName = `${projectName} ${year} | YT Descriptions + Mini-Blogs`

  // Create the spreadsheet
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: sheetName },
      sheets: [
        {
          properties: { title: "Tracker" },
        },
      ],
    },
  })

  const spreadsheetId = spreadsheet.data.spreadsheetId!

  // Write header row
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Tracker!A1:G1",
    valueInputOption: "RAW",
    requestBody: {
      values: [TRACKING_COLUMNS],
    },
  })

  // Move to the target Drive folder
  await drive.files.update({
    fileId: spreadsheetId,
    addParents: folderId,
    removeParents: "root",
    fields: "id, parents",
  })

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`

  return { sheetId: spreadsheetId, sheetUrl }
}

export async function writeSheetCell(
  videoProjectId: string,
  spreadsheetId: string,
  column: string,
  row: number,
  value: string
) {
  const authClient = await getVideoAuthenticatedClient(videoProjectId)
  const sheets = google.sheets({ version: "v4", auth: authClient })

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Tracker!${column}${row}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[value]],
    },
  })
}

export async function appendSheetRows(
  videoProjectId: string,
  spreadsheetId: string,
  rows: string[][]
) {
  const authClient = await getVideoAuthenticatedClient(videoProjectId)
  const sheets = google.sheets({ version: "v4", auth: authClient })

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Tracker!A:G",
    valueInputOption: "RAW",
    requestBody: {
      values: rows,
    },
  })
}

export async function readSheetColumn(
  videoProjectId: string,
  spreadsheetId: string,
  column: string,
  startRow: number,
  endRow: number
): Promise<(string | undefined)[]> {
  const authClient = await getVideoAuthenticatedClient(videoProjectId)
  const sheets = google.sheets({ version: "v4", auth: authClient })

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `Tracker!${column}${startRow}:${column}${endRow}`,
  })

  return (res.data.values || []).map((row) => row[0] as string | undefined)
}

export async function readSheetRange(
  videoProjectId: string,
  spreadsheetId: string,
  range: string
): Promise<string[][]> {
  const authClient = await getVideoAuthenticatedClient(videoProjectId)
  const sheets = google.sheets({ version: "v4", auth: authClient })

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `Tracker!${range}`,
  })

  return (res.data.values || []) as string[][]
}
