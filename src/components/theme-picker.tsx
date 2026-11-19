import {
	Button,
	makeStyles,
	Menu,
	MenuGroup,
	MenuGroupHeader,
	MenuItemRadio,
	MenuList,
	MenuPopover,
	MenuTrigger,
	tokens,
} from "@fluentui/react-components";
import { Color24Regular } from "@fluentui/react-icons";
import { findTheme, PRIME_THEMES } from "#/theme/primeThemes";
import { useTheme } from "#/theme/useTheme";

const useStyles = makeStyles({
	option: {
		display: "flex",
		alignItems: "center",
		gap: "10px",
		minWidth: "232px",
	},
	optionText: {
		display: "flex",
		flexDirection: "column",
		minWidth: 0,
	},
	optionName: {
		lineHeight: "18px",
	},
	optionDescription: {
		fontSize: tokens.fontSizeBase200,
		lineHeight: "16px",
		color: tokens.colorNeutralForeground3,
	},
	swatch: {
		position: "relative",
		flexShrink: 0,
		width: "32px",
		height: "24px",
		borderRadius: tokens.borderRadiusSmall,
		overflow: "hidden",
		border: `1px solid ${tokens.colorNeutralStroke2}`,
	},
	swatchBar: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: "6px",
	},
	swatchCard: {
		position: "absolute",
		left: "5px",
		right: "5px",
		top: "11px",
		bottom: "4px",
		borderRadius: "1px",
	},
	trigger: {
		color: "var(--prime-header-fg)",
		":hover": {
			color: "var(--prime-header-fg)",
			backgroundColor: "var(--prime-header-hover)",
		},
	},
});

export function ThemePicker() {
	const styles = useStyles();
	const { theme, setTheme } = useTheme();

	return (
		<Menu
			checkedValues={{ theme: [theme.id] }}
			onCheckedValueChange={(_, data) => {
				const picked = findTheme(data.checkedItems[0]);
				if (picked) setTheme(picked);
			}}
		>
			<MenuTrigger disableButtonEnhancement>
				<Button
					appearance="subtle"
					className={styles.trigger}
					icon={<Color24Regular />}
					title={`Theme: ${theme.name}`}
					aria-label={`Theme: ${theme.name}`}
				/>
			</MenuTrigger>
			<MenuPopover>
				<MenuList>
					<MenuGroup>
						<MenuGroupHeader>Theme</MenuGroupHeader>
						{PRIME_THEMES.map((option) => (
							<MenuItemRadio key={option.id} name="theme" value={option.id}>
								<span className={styles.option}>
									<span
										className={styles.swatch}
										aria-hidden
										style={{ background: option.swatch.page }}
									>
										<span
											className={styles.swatchBar}
											style={{ background: option.swatch.bar }}
										/>
										<span
											className={styles.swatchCard}
											style={{ background: option.swatch.card }}
										/>
									</span>
									<span className={styles.optionText}>
										<span className={styles.optionName}>{option.name}</span>
										<span className={styles.optionDescription}>
											{option.description}
										</span>
									</span>
								</span>
							</MenuItemRadio>
						))}
					</MenuGroup>
				</MenuList>
			</MenuPopover>
		</Menu>
	);
}
