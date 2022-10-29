#include <vector>
#include <iostream>
#include "MessagePassing.h"

//A valid message from/to the browser is preposed with 4-bytes header containing the length
struct MessageHeader
{
	uint32_t MessageLength = 0;
};

//Reads the message from stdin
std::u8string ReceiveNativeExtensionMessage()
{
	MessageHeader messageHeader = {};
	std::cin.read(reinterpret_cast<char*>(&messageHeader), sizeof(MessageHeader));

	std::u8string message;
	message.resize(messageHeader.MessageLength);
	std::cin.read(reinterpret_cast<char*>(message.data()), static_cast<std::streamsize>(messageHeader.MessageLength * sizeof(std::u8string::value_type)));

	return message;
}

//Encloses the message in quotes and writes it to stdout
void SendNativeExtensionMessage(const std::u8string& msg)
{
	MessageHeader header;
	header.MessageLength = msg.size() + 2 * sizeof(char);

	size_t requiredSize = sizeof(MessageHeader) + header.MessageLength * sizeof(char8_t);
	std::vector<std::byte> buffer(requiredSize);

	size_t recordedSize = 0;
	const char quote = '\"';

	//Write the header
	memcpy(buffer.data() + recordedSize, &header, sizeof(MessageHeader));
    recordedSize += sizeof(MessageHeader);

	//Write the opening quote
	memcpy(buffer.data() + recordedSize, &quote, sizeof(char));
    recordedSize += sizeof(char);

	//Write the message contents
	memcpy(buffer.data() + recordedSize, msg.data(), msg.size());
    recordedSize += msg.size();

	//Write the closing quote
	memcpy(buffer.data() + recordedSize, &quote, sizeof(char));
    recordedSize += sizeof(char);

	std::cout.write(reinterpret_cast<const char*>(buffer.data()), static_cast<std::streamsize>(recordedSize));
	std::cout.flush(); //Don't forget to flush stdout after write
}