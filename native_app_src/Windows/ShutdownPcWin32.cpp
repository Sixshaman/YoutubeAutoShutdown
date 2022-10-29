#include <Windows.h>
#include <CommCtrl.h>
#include <string_view>
#include <chrono>
#include "../ShutdownPc.h"

void SystemShutdown()
{
	system("shutdown /s /t 0 /c \"Shutting down the PC...\"");
}

void ShowShutdownTimeoutDialog(int argc, char* argv[])
{
	HINSTANCE hInstance = GetModuleHandle(nullptr);

	using TimePoint = decltype(std::chrono::high_resolution_clock::now());
	TimePoint startTime = std::chrono::high_resolution_clock::now();

	TASKDIALOGCONFIG tdConfig   = {};
	tdConfig.cbSize             = sizeof(TASKDIALOGCONFIG);
	tdConfig.hwndParent         = nullptr;
	tdConfig.hInstance          = hInstance;
	tdConfig.dwFlags            = TDF_ALLOW_DIALOG_CANCELLATION | TDF_CALLBACK_TIMER;
	tdConfig.dwCommonButtons    = TDCBF_CANCEL_BUTTON;
	tdConfig.pszWindowTitle     = L"Shutting down...";
	tdConfig.pszMainIcon        = TD_INFORMATION_ICON;
	tdConfig.pszMainInstruction = L"Shutting down in 10 seconds...";
	tdConfig.pszContent         = L"";
	tdConfig.cButtons           = 0;
	tdConfig.pButtons           = nullptr;
	tdConfig.nDefaultButton     = IDCANCEL;
	tdConfig.cRadioButtons      = 0;
	tdConfig.pRadioButtons      = nullptr;
	tdConfig.lpCallbackData     = reinterpret_cast<LONG_PTR>(&startTime);

	tdConfig.pfCallback = [](HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam, LONG_PTR lpRefData) -> HRESULT
	{
		TimePoint startTime = *(reinterpret_cast<TimePoint*>(lpRefData));
		TimePoint currTime  = std::chrono::high_resolution_clock::now();

		int64_t secondsPassed = std::chrono::duration_cast<std::chrono::seconds>(currTime - startTime).count();

        int secondsLeft = 10 - (int)secondsPassed;
        if(secondsLeft >= 0)
        {
            std::wstring newText = L"Shutting down in " + std::to_wstring(secondsLeft) + L" seconds...";
			SendMessage(hwnd, TDM_UPDATE_ELEMENT_TEXT, TDE_MAIN_INSTRUCTION, reinterpret_cast<LPARAM>(newText.data()));
        }
		else
        {
			SystemShutdown();
        }

		return S_OK;
	};

	TaskDialogIndirect(&tdConfig, nullptr, nullptr, nullptr);
}