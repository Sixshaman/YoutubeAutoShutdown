#include <string>

//Reads the message from stdin
std::u8string ReceiveNativeExtensionMessage();

//Encloses the message in quotes and writes it to stdout
void SendNativeExtensionMessage(const std::u8string& msg);