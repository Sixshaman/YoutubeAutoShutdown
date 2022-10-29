#include "MessagePassing.h"
#include "ShutdownPc.h"

int main(int argc, char* argv[])
{
	std::u8string msg = ReceiveNativeExtensionMessage();
	if(msg == u8"\"shutdown\"")
	{
		ShowShutdownTimeoutDialog(argc, argv);
		SendNativeExtensionMessage(u8"ok");
	}
	else if(msg == u8"\"check\"")
	{
		SendNativeExtensionMessage(u8"ok");
	}
}