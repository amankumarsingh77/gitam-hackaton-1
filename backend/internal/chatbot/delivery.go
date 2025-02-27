package chatbot

import "github.com/labstack/echo/v4"

type Handlers interface{
	
	AddChatResponse() echo.HandlerFunc
	GetHistory() echo.HandlerFunc

}
