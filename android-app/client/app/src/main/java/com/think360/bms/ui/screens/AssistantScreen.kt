package com.think360.bms.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.think360.bms.data.ChatMessage
import com.think360.bms.ui.theme.*
import com.think360.bms.viewmodel.BmsViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssistantScreen(viewModel: BmsViewModel, navController: NavController) {
    val messages by viewModel.chatMessages.collectAsState()
    val isLoading by viewModel.isChatLoading.collectAsState()
    var inputText by remember { mutableStateOf("") }
    
    // Listen for navigation actions triggered by the AI parser
    LaunchedEffect(Unit) {
        viewModel.assistantAction.collect { route ->
            navController.navigate(route) {
                // To avoid deep stacking when AI jumps around
                popUpTo(navController.graph.startDestinationId) { saveState = true }
                launchSingleTop = true
                restoreState = true
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBg)
            .statusBarsPadding()
    ) {
        // ── Header ──
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = ColorText)
            }
            Spacer(Modifier.width(8.dp))
            Icon(Icons.Filled.AutoAwesome, contentDescription = null, tint = ColorPrimary)
            Spacer(Modifier.width(8.dp))
            Text("EVGuardian AI", color = ColorText, fontSize = 20.sp, fontWeight = FontWeight.Black)
        }

        HorizontalDivider(color = ColorBorder)

        // ── Chat History ──
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            contentPadding = PaddingValues(vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(messages) { msg ->
                ChatBubble(msg)
            }
            if (isLoading) {
                item {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Start) {
                        Box(
                            modifier = Modifier
                                .background(ColorSurface, RoundedCornerShape(16.dp))
                                .padding(horizontal = 16.dp, vertical = 12.dp)
                        ) {
                            Text("Thinking...", color = ColorText4, fontSize = 14.sp)
                        }
                    }
                }
            }
        }

        // ── Input Area ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(ColorSurface)
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .navigationBarsPadding()
        ) {
            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Ask about battery, navigation, AC...", color = ColorText4) },
                shape = RoundedCornerShape(24.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = ColorBorder,
                    focusedBorderColor = ColorPrimary,
                    focusedContainerColor = ColorBg,
                    unfocusedContainerColor = ColorBg
                ),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(
                    onSend = {
                        if (inputText.isNotBlank()) {
                            viewModel.sendChat(inputText)
                            inputText = ""
                        }
                    }
                ),
                trailingIcon = {
                    IconButton(
                        onClick = {
                            if (inputText.isNotBlank()) {
                                viewModel.sendChat(inputText)
                                inputText = ""
                            }
                        },
                        modifier = Modifier.background(ColorPrimary, RoundedCornerShape(50)).size(36.dp)
                    ) {
                        Icon(androidx.compose.material.icons.Icons.Filled.Send, contentDescription = "Send", tint = Color.White, modifier = Modifier.size(16.dp))
                    }
                }
            )
        }
    }
}

@Composable
fun ChatBubble(message: ChatMessage) {
    val isUser = message.role == "user"
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        if (!isUser) {
            Box(
                modifier = Modifier.size(32.dp).background(ColorPrimaryBg, RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.AutoAwesome, contentDescription = "AI", tint = ColorPrimary, modifier = Modifier.size(18.dp))
            }
            Spacer(Modifier.width(8.dp))
        }
        
        Box(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .background(
                    color = if (isUser) ColorPrimary else ColorSurface,
                    shape = RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isUser) 16.dp else 4.dp,
                        bottomEnd = if (isUser) 4.dp else 16.dp
                    )
                )
                .border(
                    width = 1.dp,
                    color = if (isUser) ColorPrimary else ColorBorder,
                    shape = RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isUser) 16.dp else 4.dp,
                        bottomEnd = if (isUser) 4.dp else 16.dp
                    )
                )
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            val textColor = if (isUser) Color.White else ColorText
            Text(
                text = parseMarkdown(message.content, textColor),
                fontSize = 15.sp,
                lineHeight = 22.sp
            )
        }
    }
}

fun parseMarkdown(text: String, defaultColor: Color): AnnotatedString {
    return buildAnnotatedString {
        var currentIndex = 0
        // Match **bold** or *italic* but prevent matching across newlines for bullet points
        val regex = Regex("\\*\\*([^\\*]+)\\*\\*|\\*([^\\*\\n]+)\\*")
        val matches = regex.findAll(text)
        
        for (match in matches) {
            withStyle(style = SpanStyle(color = defaultColor)) {
                append(text.substring(currentIndex, match.range.first))
            }
            if (match.value.startsWith("**")) {
                withStyle(style = SpanStyle(fontWeight = FontWeight.Bold, color = defaultColor)) {
                    append(match.groupValues[1])
                }
            } else {
                withStyle(style = SpanStyle(fontStyle = FontStyle.Italic, color = defaultColor)) {
                    append(match.groupValues[2])
                }
            }
            currentIndex = match.range.last + 1
        }
        withStyle(style = SpanStyle(color = defaultColor)) {
            append(text.substring(currentIndex))
        }
    }
}
