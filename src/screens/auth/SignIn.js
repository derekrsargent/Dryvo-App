import React from "react"
import {
	View,
	ScrollView,
	Text,
	StyleSheet,
	TouchableOpacity,
	KeyboardAvoidingView
} from "react-native"
import {
	deepLinkingListener,
	deepLinkingRemoveListener
} from "../../actions/utils"
import { connect } from "react-redux"
import { exchangeToken, openFacebook, directLogin } from "../../actions/auth"
import { API_ERROR, POP_ERROR } from "../../reducers/consts"
import { getLatestError } from "../../error_handling"
import { strings } from "../../i18n"
import { colors, MAIN_PADDING } from "../../consts"
import Logo from "../../components/Logo"
import AuthInput from "../../components/AuthInput"
import validate, { loginValidation } from "../../actions/validate"

export class SignIn extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			email: "",
			password: "",
			error: ""
		}
		this.handleOpenURL = this.handleOpenURL.bind(this)
		this.login = this.login.bind(this)
	}

	handleOpenURL = async event => {
		if (event.url) {
			let url = event.url.replace("#_=_", "")
			console.log(`Launched from deeplink ${url}`)
			url = new URLSearchParams(url).toString()
			let regex = /token=(.*)/
			const token = url.match(regex)[1]
			console.log(`New exchange token ${token}`)
			this.props.dispatch(
				exchangeToken(token, user => {
					this.props.navigation.navigate("App")
				})
			)
		}
	}

	async componentDidMount() {
		/* dismiss all errors on focus
		https://stackoverflow.com/questions/49458226/react-native-react-navigation-rerender-panel-on-goback
		*/
		this.willFocusSubscription = this.props.navigation.addListener(
			"willFocus",
			payload => {
				this.setState({
					error: ""
				})
			}
		)
		deepLinkingListener(this.handleOpenURL)
	}

	async componentWillUnmount() {
		this.willFocusSubscription.remove()
		await deepLinkingRemoveListener(this.handleOpenURL)
	}

	componentDidUpdate() {
		const error = getLatestError(this.props.errors[API_ERROR])
		if (error) {
			this.setState({ error })
			this.props.dispatch({ type: POP_ERROR, errorType: API_ERROR })
		}
	}

	async login() {
		const emailError = validate("email", this.state.email, loginValidation)
		const passwordError = validate(
			"password",
			this.state.password,
			loginValidation
		)

		this.setState({
			emailError: emailError,
			passwordError: passwordError
		})

		if (emailError || passwordError) return

		await this.props.dispatch(
			directLogin(this.state.email, this.state.password, () => {
				this.props.navigation.navigate("App")
			})
		)
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.topLogo}>
					<Logo size="medium" />
				</View>
				<KeyboardAvoidingView behavior="padding">
					<ScrollView
						keyboardDismissMode="on-drag"
						keyboardShouldPersistTaps="always"
					>
						<View style={styles.formContainer}>
							<Text testID="error">{this.state.error}</Text>
							<AuthInput
								name="email"
								placeholder={strings("signin.email")}
								onChangeText={email => this.setState({ email })}
								value={this.state.email}
								testID="emailInput"
								iconName="email"
								errorMessage={this.state.emailError}
							/>
							<AuthInput
								name="password"
								placeholder={strings("signin.password")}
								onChangeText={password =>
									this.setState({ password })
								}
								value={this.state.password}
								testID="passwordInput"
								iconName="security"
								errorMessage={this.state.passwordError}
							/>
							<TouchableOpacity
								testID="signInButton"
								onPress={this.login}
								style={styles.button}
							>
								<Text style={styles.buttonText}>
									{strings("signin.login_button")}
								</Text>
							</TouchableOpacity>
							<Text style={styles.or}>
								{strings("signin.or")}
							</Text>
							<TouchableOpacity
								testID="facebookLogin"
								onPress={openFacebook}
								style={{
									...styles.button,
									...styles.facebook
								}}
							>
								<Text
									style={{
										...styles.buttonText,
										color: "#fff"
									}}
								>
									{strings("signin.facebook_login")}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								testID="signUpButton"
								onPress={() => {
									this.props.navigation.navigate("SignUp")
								}}
							>
								<View style={styles.signUpButton}>
									<Text style={styles.callToAction}>
										{strings("signin.not_yet_registered")}
									</Text>
									<Text style={styles.actionButton}>
										{" "}
										{strings("signin.signup_button")}
									</Text>
								</View>
							</TouchableOpacity>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	topLogo: {
		flex: 2,
		justifyContent: "center",
		backgroundColor: colors.blue,
		maxHeight: 240
	},
	formContainer: {
		flex: 3,
		paddingLeft: MAIN_PADDING,
		paddingRight: MAIN_PADDING,
		alignItems: "center"
	},
	button: {
		borderRadius: 32,
		padding: 20,
		backgroundColor: "#ececec",
		width: "100%",
		marginTop: 20,
		alignItems: "center"
	},
	buttonText: {
		fontSize: 20,
		color: "#9b9b9b"
	},
	facebook: {
		backgroundColor: colors.blue,
		marginTop: 0
	},
	or: {
		marginVertical: 16,
		fontWeight: "bold",
		fontSize: 20,
		color: "#c9c9c9"
	},
	callToAction: {
		color: "#9b9b9b"
	},
	signUpButton: {
		flexDirection: "row",
		marginTop: 20
	},
	actionButton: {
		color: colors.blue
	}
})

const mapStateToProps = state => {
	return {
		errors: state.errors
	}
}

export default connect(mapStateToProps)(SignIn)
